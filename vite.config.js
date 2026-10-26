import {defineConfig} from 'vite';
import {resolve} from 'node:path';
const input={home:resolve('index.html'),production:resolve('production/index.html')};
// Mirror the public route redirects in local previews.
const routeRedirects={'/lab':'/','/lab/':'/','/production':'/production/'};
const redirectPages=server=>{
  server.middlewares.use((req,res,next)=>{
    const url=new URL(req.url,'http://localhost');
    const destination=routeRedirects[url.pathname];
    if(!destination)return next();
    res.writeHead(301,{Location:destination+url.search});res.end();
  });
};
export default defineConfig({
  plugins:[{name:'page-redirects',configureServer:redirectPages,configurePreviewServer:redirectPages}],
  build:{rollupOptions:{input}}
});
