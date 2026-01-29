/**
 * Stairways Implementation for Pirate Borg System
 * Based on the Stairways module by Simon Wörner (SWW13)
 * Licensed under MIT License - see LICENSE-MIT.txt
 */

import { StairwayDocument } from "./StairwayDocument.js";

/// Hook modifyDocument events
/// we need to hijack them and redirect the save location
export const hookModifyDocument = () => {
  const origDispatch =
    foundry.helpers.SocketInterface.prototype.constructor.dispatch;
  foundry.helpers.SocketInterface.prototype.constructor.dispatch = function (
    eventName,
    request
  ) {
    // log and report error for unexpected behaviour for further investigation
    const reportError = (...args) => {
      console.error(...args);
      ui.notifications.error(
        game.i18n.localize("STAIRWAYS.Messages.InternalError")
      );
    };

    if (eventName === "modifyDocument" && request.type === "Scene") {
      if (
        !game.user.isGM &&
        (request.action === "create" || request.action === "update")
      ) {
        // Don't send create/update requests from players
        return {
          ...request,
          result: [],
        };
      }

      const response = origDispatch.bind(this)(eventName, request);

      // keep request data
      let data = [];
      if (request.action === "create") {
        data = request.operation.data;
      } else if (request.action === "update") {
        data = request.operation.updates;
      } else {
        // ignore get + delete
        if (request.action !== "get" && request.action !== "delete") {
          console.error("unknown request action", request.action);
        }

        // return unmodified request/response
        return response;
      }

      // hook response
      return new Promise((resolve, reject) => {
        response.then((value) => {
          // verify data length
          if (
            (request.action === "create" &&
              data.length !== value.result.length) ||
            (request.action === "update" &&
              !data.every((d) => value.result.some((v) => v._id === d._id)))
          ) {
            return reportError("request / response data length mismatch", {
              data,
              request,
              value,
            });
          }

          // inject stairways into scene from flags
          for (let i = 0; i < data.length; i++) {
            const flagData =
              request.action === "create"
                ? data[i]
                : data.find((d) => d._id === value.result[i]._id);
            if (!flagData?.flags) continue;
            value.result[i].stairways = foundry.utils.duplicate(
              flagData.flags.pirateborg?.stairways ?? []
            );
          }

          // return data
          resolve(value);
        });
      });
    } else if (eventName === "modifyDocument" && request.type === "Stairway") {
      return new Promise((resolve, reject) => {
        // parent scene
        const sceneId = request.operation.parentUuid.split(".")[1];
        const scene = game.scenes.get(sceneId);

        // process stairways events
        const stairways = foundry.utils.duplicate(scene.stairways._source ?? []);
        const result = [];

        if (request.action === "create") {
          for (const entry of request.operation.data) {
            const stairway = foundry.utils.duplicate(entry);
            stairways.push(stairway);
            result.push(stairway);
          }
        } else if (request.action === "update") {
          for (const update of request.operation.updates) {
            const idx = stairways.findIndex(
              (oldStairway) => oldStairway._id === update._id
            );
            if (idx < 0) {
              return reportError("missing stairway to update", update, stairways);
            }
            stairways[idx] = foundry.utils.mergeObject(stairways[idx], update);
            result.push(stairways[idx]);
          }
        } else if (request.action === "delete") {
          for (const id of request.operation.ids) {
            const idx = stairways.findIndex(
              (oldStairway) => oldStairway._id === id
            );
            if (idx < 0) {
              return reportError("missing stairway to delete", id, stairways);
            }
            stairways.splice(idx, 1);
            result.push(id);
          }
        } else {
          return reportError("unknown request action", request.action);
        }

        // update stairways in scene flags
        scene.update({ "flags.pirateborg.stairways": stairways });

        // create fake backend response
        const response = { ...request, result, userId: game.userId };
        resolve(response);

        // send stairway update event to other clients
        game.socket.emit("system.pirateborg", {
          action: "stairway",
          eventName: "modifyDocument",
          data: response,
        });
      });
    } else {
      return origDispatch.bind(this)(eventName, request);
    }
  };
};

export const handleModifyEmbeddedDocument = (response) => {
  // skip own events
  if (response.userId === game.userId || !game.users.get(response.userId)?.isGM) {
    return;
  }

  switch (response.action) {
    case "create":
      StairwayDocument.createDocuments(response.operation.data, response.operation);
      break;
    case "update":
      StairwayDocument.updateDocuments(
        response.operation.updates,
        response.operation
      );
      break;
    case "delete":
      StairwayDocument.deleteDocuments(response.operation.ids, response.operation);
      break;
  }
};
