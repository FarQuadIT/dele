import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({
 plugins:[laravel({input:['resources/js/app.tsx'],refresh:true}),react()],
 resolve:{alias:[
  {find:'@',replacement:resolve(__dirname,'resources/js')},
 ]},
});
