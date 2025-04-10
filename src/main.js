import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import createAppStore from './store' // <-- renamed import
import './assets/styles/main.scss'

const loadCompletedTasksFromStorage = () => {
  const completedTasks = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('arc-task-')) {
        const taskId = key.replace('arc-task-', '');
        const data = JSON.parse(localStorage.getItem(key));
        completedTasks[taskId] = data;
      }
    }
  } catch (e) {
    console.error("Error loading tasks from localStorage:", e);
  }
  return completedTasks;
};

const initialState = {
  completedTasks: loadCompletedTasksFromStorage(),
};

const app = createApp(App);
const store = createAppStore(initialState); // ✅ use custom factory

app.use(store);
app.use(router);

store.dispatch('initializeStore').then(() => {
  app.mount('#app');
});
