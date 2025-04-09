import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/styles/main.scss'

// Dispatch initialization action after creating the app instance
const app = createApp(App);
app.use(store);
app.use(router);

// Initialize store after it's used by the app
store.dispatch('initializeStore').then(() => {
   app.mount('#app');
});


// createApp(App).use(store).use(router).mount('#app')