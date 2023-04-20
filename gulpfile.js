import dotenv             from 'dotenv';
import { fork, spawn, spawnSync }    from 'child_process';
import path, { dirname }  from 'path';
import gulp               from 'gulp';
import ts                 from 'gulp-typescript';
import notify             from 'gulp-notify';
import gulpEsbuild        from 'gulp-esbuild';
import esbuild            from 'esbuild';
import sourcemaps         from 'gulp-sourcemaps';
import gulpif             from 'gulp-if';
import cleanCSS           from 'gulp-clean-css';
import cssProcessor       from 'gulp-stylus';
import autoprefixer       from 'gulp-autoprefixer';
import nunjucksRender     from 'gulp-nunjucks-render';
import fs                 from 'fs';
import del                from 'delete';
import { throttle, checkParam, gulpLiveReloader, getFreePort } from './tools/gulpUtils.js';
dotenv.config();

const {
  series, parallel,
  src, dest,
  watch
} = gulp;

const majorVersion = 1;
const minorVersion = 3;

const __dirname = path.resolve();

console.log(`Gulp file version: v${majorVersion}.${minorVersion}`);

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
const devMode = process.env.NODE_ENV === 'development';

const tsClientProject = ts.createProject('src/client/ts/tsconfig.json');

const defaultPort = 8080;
const defaultWSPort = 8000;

async function setPorts(done) {
  if (!process.env.PORT) {
    const freePort = await getFreePort(defaultPort);
    process.env.PORT = freePort;
  }

  if (!process.env.WSPORT) {
    const freeWSPort = await getFreePort(defaultWSPort);
    process.env.WSPORT = freeWSPort;
  }

  return done();
}

const
  params = process.argv,
  staticOnly = checkParam(params, 'static'),
  runServer = checkParam(params, 'server'),
  isProd = checkParam(params, 'production');

/* Processing tasks */
const HTMLRenderEnvironment = (environment) => {
  environment.opts.autoescape = false;
  const noCache = true;
  
  environment.addFilter('json', (value, spaces) => {
    value = value.toString();
    const jsonString = JSON.stringify(value, null, spaces).replace(/</g, '\\u003c');
    return nunjucksRender.nunjucks.runtime.markSafe(jsonString);
  });
};

function html(done) {
  const viewsFolder = 'src/views/*.*';
  const templateFolders = ['src/views'];
  const dataFolder = 'src/data/';
  const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, dataFolder, 'data.json'), 'utf8'));

  return src(viewsFolder)
    .pipe(nunjucksRender({
      manageEnv: HTMLRenderEnvironment,
      path: templateFolders, // template folder accessed by the engine
      data: {
        serverData: {
          devMode,
          version: +new Date(),
          source: 'gulp',
          data
        }
      }
    }))
    .pipe(dest('build/client'))
}

function views(done) {
  return src('src/views/**/*.*')
    .pipe(dest('build/views'));
}

function css(done) {
  return src('src/client/styles/*.styl')
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(autoprefixer())
    .pipe(cssProcessor()) // TODO: поменять местами?
    // .pipe(gulpif(isProd, cleanCSS({compatibility: 'ie11'})))
    .pipe(gulpif(!isProd, sourcemaps.write('.')))
    .pipe(dest('build/client/styles'))
}

/*
function nodeModules(done) {
  src(gnf(), { base:'./' })
    .pipe(rename(function(path) {
      path.dirname = path.dirname.replace(/node_modules/, 'vendor');
    }))
    .pipe(dest(paths.build.js));
  done();
};*/

function data(done) {
  return src('src/data/**/*.*').pipe(dest('build/data'));
}

function publicUpdate(done) {
  return src('src/public/**/*.*')
    .pipe(dest('build/client'));
}

function images() {
  return src('src/client/images/**/*.*')
    .pipe(dest('build/client/images'));
}

let reloadTimeout;

function watchFiles(done) {
  const { broadcastWSMessage } = gulpLiveReloader(process.env.WSPORT);
  const reloadThrottle = 500;

  const reload = (done) => {
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
      broadcastWSMessage({ message: 'reload' });
    }, reloadThrottle);
    
    if (!done) {
      return true;
    } else {
      return done();
    }
  };

  const stream = (message) => {
    broadcastWSMessage({
      message
    });
  };

  function reloadCSS(done) {
    stream('injectCSS');
    return done();
  }

  function reloadImages(done) {
    stream('reloadImages');
    return done();
  }

  watch('src/public/**/*.*',        series(publicUpdate, bundleServer, startServer, reload));
  watch('src/data/**/*.*',          series(data, bundleServer, startServer, reload));
  watch('src/client/images/**/*.*', series(images, reloadImages));
  watch('src/client/styles/**/*.*', series(css, reloadCSS));
  watch('src/client/ts/**/*.*',     series(tsClient, bundleTS, reload));
  watch('src/client/js/**/*.*',     series(bundleJS, reload));
  watch('src/server/**/*.*',        series(bundleServer, startServer, reload));
  watch('src/views/**/*.*',         series(html, views, bundleServer, startServer, reload));
  
  return done();
}

function clean(done) {
  // return done();
  return del(['build'], done);
}

// CLIENT
function tsClient() {
  return tsClientProject
    .src()
    .pipe(tsClientProject())
    .on('error', notify.onError(function (error) {
      return {
        message: error.message,
        wait: false
      };
    }))
    .js
}

function bundleTS(done) {
  const config = {
    bundle: true,
    minify: isProd,
    target: [
      'es2020'
    ],
    sourcemap: !isProd && 'inline',
  };

  const entryPoints = ['src/client/ts/app.ts'/*, 'src/client/ts/admin.ts'*/];

  esbuild.buildSync(Object.assign(config, {
    entryPoints,
    outdir: 'build/client/ts',
  }));

  return done();
}

function bundleJS(done) {
  const config = {
    bundle: true,
    minify: isProd,
    target: [
      'es2020'
    ],
    sourcemap: !isProd && 'inline',
  };

  // JavaScript
  const entryPoints = ['src/client/js/app.js'/*, 'src/client/js/admin.js'*/];
  esbuild.buildSync(Object.assign(config, {
    entryPoints,
    outdir: 'build/client/js',
  }));

  return done();
}

function bundleServer(done) {
  return src('src/server/**/*.*')
    .pipe(dest('build/server'));
}

// SERVER
let CURRENT_SERVER_PROCESS;
let browserOpened = false;

async function startServer(done) {
  if (CURRENT_SERVER_PROCESS) {
    await CURRENT_SERVER_PROCESS.kill('SIGINT');
  }

  const args = [];

  if (staticOnly) {
    args.push('--static');
  }

  CURRENT_SERVER_PROCESS = fork('./build/server/server.js', args);
  // TODO: add on error exit

  CURRENT_SERVER_PROCESS.on('message', (data) => {
    if (data.message === 'ready') {
      if (!browserOpened && checkParam(params, 'open')) {
        const openCommand = (process.platform == 'darwin'? 'open': (process.platform == 'win32'? 'start': 'xdg-open'));
        const s = process.env.HTTPSKEY && process.env.HTTPSCRT ? 's' : '';
        const url = `http${s}://localhost:${process.env.PORT}`;
        
        spawnSync(`${openCommand} ${url}`, [], { shell: true });
        browserOpened = true;
      }

      return done();
    }
  });
  // return done();
}

function finish(done) {
  setTimeout(() => {
    process.exit(0);
  }, 500);
  
  return done();
}

const build = series(clean, parallel(tsClient, html, views, images, bundleJS, bundleServer, css, data, publicUpdate), finish);
const dev = series(setPorts, parallel(tsClient, html, views, bundleJS, bundleServer, css, data, publicUpdate), startServer, watchFiles);
const start = series(clean, setPorts, parallel(tsClient, html, views, images, bundleJS, bundleServer, css, data, publicUpdate), startServer, watchFiles);

export default dev;
export { build, start };