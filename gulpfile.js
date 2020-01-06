'use strict';

/* rutas a los archivos de origen (src), a los archivos terminados (compilación), así como a aquellos cuyos cambios necesita ver (ver) */
var path = {
    build: {
        html: 'assets/build/',
        js: 'assets/build/js/',
        css: 'assets/build/css/',
        img: 'assets/build/img/',
        fonts: 'assets/build/fonts/'
    },
    src: {
        html: 'assets/src/*.html',
        js: 'assets/src/js/main.js',
        style: 'assets/src/style/main.scss',
        img: 'assets/src/img/**/*.*',
        fonts: 'assets/src/fonts/**/*.*'
    },
    watch: {
        html: 'assets/src/**/*.html',
        js: 'assets/src/js/**/*.js',
        css: 'assets/src/style/**/*.scss',
        img: 'assets/src/img/**/*.*',
        fonts: 'assets/srs/fonts/**/*.*'
    },
    clean: './assets/build/*'
};

/* configuración del servidor */
var config = {
    server: {
        baseDir: './assets/build'
    },
    notify: false
};

/* conectar gulp y complementos */
var gulp = require('gulp'),  // conectar gulp
    webserver = require('browser-sync'), // servidor para trabajo y actualización automática de página
    plumber = require('gulp-plumber'), // módulo de seguimiento de errores
    rigger = require('gulp-rigger'), // módulo para importar el contenido de un archivo a otro
    sourcemaps = require('gulp-sourcemaps'), // módulo para generar un mapa de archivos fuente
    sass = require('gulp-sass'), // módulo de compilación SASS (SCSS) a CSS
    autoprefixer = require('gulp-autoprefixer'), // módulo para instalación automática de prefijos automáticos
    cleanCSS = require('gulp-clean-css'), // complemento para minimizar CSS
    uglify = require('gulp-uglify'), // módulo para minimizar JavaScript
    cache = require('gulp-cache'), // módulo de almacenamiento en caché
    imagemin = require('gulp-imagemin'), // Plugin para comprimir imágenes PNG, JPEG, GIF y SVG
    jpegrecompress = require('imagemin-jpeg-recompress'), // plugin de compresión jpeg
    pngquant = require('imagemin-pngquant'), // Complemento de compresión PNG
    rimraf = require('gulp-rimraf'), // plugin para eliminar archivos y directorios
    rename = require('gulp-rename');

/* tareas */

// inicio del servidor
gulp.task('webserver', function () {
    webserver(config);
});

// colección html
gulp.task('html:build', function () {
    return gulp.src(path.src.html) // selección de todos los archivos html en la ruta especificada
        .pipe(plumber()) // seguimiento de errores
        .pipe(rigger()) // importación de inversiones
        .pipe(gulp.dest(path.build.html)) // subir archivos terminados
        .pipe(webserver.reload({ stream: true })); // reinicio del servidor
});

// colección de estilos
gulp.task('css:build', function () {
    return gulp.src(path.src.style) // obtener main.scss
        .pipe(plumber()) // para rastrear errores
        .pipe(sourcemaps.init()) // inicializar mapa de origen
        .pipe(sass()) // scss -> css
        .pipe(autoprefixer()) // agregar prefijos
        .pipe(gulp.dest(path.build.css))
        .pipe(rename({ suffix: '.min' }))
        .pipe(cleanCSS()) // minimizar CSS
        .pipe(sourcemaps.write('./')) // escribir mapa fuente
        .pipe(gulp.dest(path.build.css)) // subir a construir
        .pipe(webserver.reload({ stream: true })); // reiniciar el servidor
});

// recogiendo js
gulp.task('js:build', function () {
    return gulp.src(path.src.js) // obtenemos el archivo main.js
        .pipe(plumber()) // para rastrear errores
        .pipe(rigger()) // importar todos los archivos especificados en main.js
        .pipe(gulp.dest(path.build.js))
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.init()) // inicializar mapa de origen
        .pipe(uglify()) // minimizar js
        .pipe(sourcemaps.write('./')) // escribir mapa fuente
        .pipe(gulp.dest(path.build.js)) // poner el archivo terminado
        .pipe(webserver.reload({ stream: true })); // reiniciar el servidor
});

// transferencia de fuente
gulp.task('fonts:build', function () {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
});

// procesamiento de imagen
gulp.task('image:build', function () {
    return gulp.src(path.src.img) // camino con imágenes de origen
        .pipe(cache(imagemin([ // compresión de imagen
            imagemin.gifsicle({ interlaced: true }),
            jpegrecompress({
                progressive: true,
                max: 90,
                min: 80
            }),
            pngquant(),
            imagemin.svgo({ plugins: [{ removeViewBox: false }] })
        ])))
        .pipe(gulp.dest(path.build.img)); // descargando archivos terminados
});

// eliminar directorio de compilación
gulp.task('clean:build', function () {
    return gulp.src(path.clean, { read: false })
        .pipe(rimraf());
});

// borrar caché
gulp.task('cache:clear', function () {
    cache.clearAll();
});

// asamblea
gulp.task('build',
    gulp.series('clean:build',
        gulp.parallel(
            'html:build',
            'css:build',
            'js:build',
            'fonts:build',
            'image:build'
        )
    )
);

// iniciar tareas al cambiar archivos
gulp.task('watch', function () {
    gulp.watch(path.watch.html, gulp.series('html:build'));
    gulp.watch(path.watch.css, gulp.series('css:build'));
    gulp.watch(path.watch.js, gulp.series('js:build'));
    gulp.watch(path.watch.img, gulp.series('image:build'));
    gulp.watch(path.watch.fonts, gulp.series('fonts:build'));
});

// tarea predeterminada
gulp.task('default', gulp.series(
    'build',
    gulp.parallel('webserver','watch')      
));