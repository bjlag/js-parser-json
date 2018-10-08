'use strict';

const
    gulp = require( 'gulp' ),
    tasks = require( './gulp/tasks' );

tasks.watch.displayName = 'watch';
tasks.liveReload.displayName = 'reload';

gulp.task( 'live-reload', tasks.liveReload );
gulp.task( 'build', gulp.parallel( tasks.watch, tasks.liveReload ) );
