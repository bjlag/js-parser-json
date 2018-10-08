'use strict';

const
    gulp = require( 'gulp' ),
    bs = require( 'browser-sync' ).create(),
    paths = require( './paths' ),
    tasks = {};

function reload( done ) {
    bs.reload();
    done();
}

/**
 * Отслеживание изменений
 */
tasks.watch = function ( done ) {
    gulp.watch( paths.watch.js, reload );
    gulp.watch( paths.watch.html, reload );

    done();
};

/**
 * Автоперезагрузка браузера
 */
tasks.liveReload = function ( done ) {
    bs.init( {
        server: {
            baseDir: paths.src
        },
        notify: false
    } );

    done();
};

module.exports = tasks;
