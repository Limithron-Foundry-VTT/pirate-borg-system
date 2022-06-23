const concat = require("gulp-concat");
const gulp = require("gulp");
const prefix = require("gulp-autoprefixer");
const gsass = require("gulp-sass")(require("sass"));

gulp.task("pirate-sass", function () {
  return gulp
    .src("scss/pirateborg/**/*.scss")
    .pipe(gsass({ outputStyle: "expanded" }).on("error", gsass.logError))
    .pipe(prefix({ cascade: false }))
    .pipe(concat("pirateborg.css"))
    .pipe(gulp.dest("./css"));
});

gulp.task("skin-sass", function () {
  return gulp
    .src("scss/skins/**/*.scss")
    .pipe(gsass({ outputStyle: "expanded" }).on("error", gsass.logError))
    .pipe(prefix({ cascade: false }))
    .pipe(gulp.dest("./css/skins"));
});

gulp.task("sass", gulp.parallel("pirate-sass", "skin-sass"));

gulp.task("watch", gulp.parallel(["pirate-sass", "skin-sass"], () => {
  gulp.watch("scss/pirateborg/**/*.scss", gulp.series(["mork-sass"]));
  gulp.watch("scss/skins/**/*.scss", gulp.series(["skin-sass"]));
}),);
