import { createStore } from 'vuex'
import axios from 'axios'

// API endpoints for ARC 1 and ARC 2
const API_ENDPOINTS = {
  1: {
    base: 'https://api.github.com/repos/fchollet/ARC/contents/data',
    name: 'ARC 1'
  },
  2: {
    base: 'https://api.github.com/repos/arcprize/ARC-AGI-2/contents/data',
    name: 'ARC 2'
  }
}

export default function createAppStore(initialState = {}) {
  return createStore({
    state: {
    currentUser: localStorage.getItem('arc-current-user') || '', // Store current user
    completedTasks: {}, 
    completionData: {},
    currentTask: null,
    taskName: '',
    trainExamples: [],
    testPairs: [],
    currentTestPairIndex: 0,
    currentInputGrid: null,
    currentOutputGrid: null,
    selectedSymbol: 0,
    currentSubset: 'training',
    currentTaskIndex: 0,
    totalTaskCount: 0,
    tasksMetadata: {},
    arcVersion: 2, // Default to ARC 2
  },
  getters: {
    isTaskCompleted: (state) => (taskId) => {
        return !!state.completionData[taskId]?.completed;
    },
    currentTestInput(state) {
      if (state.testPairs.length === 0) return null
      return state.testPairs[state.currentTestPairIndex]?.input || null
    },
    currentTestOutput(state) {
      if (state.testPairs.length === 0) return null
      return state.testPairs[state.currentTestPairIndex]?.output || null
    },
    apiEndpoint: (state) => {
      return API_ENDPOINTS[state.arcVersion]?.base || API_ENDPOINTS[2].base
    },
    arcVersionName: (state) => {
      return API_ENDPOINTS[state.arcVersion]?.name || 'ARC 2'
    },
    // Get all completion data for a specific task
    getTaskCompletionData: (state) => (taskId) => {
      // First check in memory cache
      if (state.completedTasks && state.completedTasks[taskId]) {
        return state.completedTasks[taskId];
      }
      
      // Otherwise check localStorage
      try {
        const storageKey = `arc-task-${taskId}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          
          // Update in-memory cache
          if (!state.completedTasks) state.completedTasks = {};
          state.completedTasks[taskId] = parsedData;
          
          return parsedData;
        }
      } catch (e) {
        console.error("Error retrieving from localStorage:", e);
      }
      
      return { completed: false };
    },
    
    // Get all completion data for export
    getAllCompletionData: (state) => {
      const allData = {};
      
      // First collect all stored data
      try {
        // Get all keys from localStorage that match our pattern
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('arc-task-')) {
            const taskId = key.replace('arc-task-', '');
            const data = JSON.parse(localStorage.getItem(key));
            allData[taskId] = data;
          }
        }
      } catch (e) {
        console.error("Error accessing localStorage:", e);
      }
      
      return allData;
    }
  },
  mutations: {
    setCompletionData(state, { taskId, data }) {
          // taskId could be e.g., `<span class="math-inline">\{state\.arcVersion\}\-</span>{state.currentSubset}-${state.currentTaskIndex}`
          state.completionData[taskId] = { ...data, completed: true };
          // Persist to localStorage? (Optional but recommended)
          localStorage.setItem('arcCompletionData', JSON.stringify(state.completionData));
    },
      loadCompletionData(state) {
          const savedData = localStorage.getItem('arcCompletionData');
          if (savedData) {
            state.completionData = JSON.parse(savedData);
          }
      },
    setArcVersion(state, version) {
      state.arcVersion = version
      state.tasksMetadata = {}
      state.totalTaskCount = 0
    },
    setTask(state, { train, test, taskName, taskIndex, subset, totalCount }) {
      state.trainExamples = train
      state.testPairs = test
      state.taskName = taskName
      state.currentTaskIndex = taskIndex !== undefined ? taskIndex : state.currentTaskIndex
      state.currentSubset = subset || state.currentSubset
      state.currentTestPairIndex = 0
      if (totalCount !== undefined) {
        state.totalTaskCount = totalCount
      }

      // Set current input grid
      if (test.length > 0) {
        state.currentInputGrid = test[0].input
      }

      // Initialize empty output grid with same dimensions as input
      if (test.length > 0) {
        const inputGrid = test[0].input
        state.currentOutputGrid = Array(inputGrid.length).fill().map(() => 
          Array(inputGrid[0].length).fill(0)
        )
      }
    },
    nextTestInput(state) {
      if (state.currentTestPairIndex < state.testPairs.length - 1) {
        state.currentTestPairIndex++
        state.currentInputGrid = state.testPairs[state.currentTestPairIndex].input
        
        // Initialize empty output grid with same dimensions as new input
        const inputGrid = state.currentInputGrid
        state.currentOutputGrid = Array(inputGrid.length).fill().map(() => 
          Array(inputGrid[0].length).fill(0)
        )
      }
    },
    previousTestInput(state) {
      if (state.currentTestPairIndex > 0) {
        state.currentTestPairIndex--
        state.currentInputGrid = state.testPairs[state.currentTestPairIndex].input
        
        // Initialize empty output grid with same dimensions as new input
        const inputGrid = state.currentInputGrid
        state.currentOutputGrid = Array(inputGrid.length).fill().map(() => 
          Array(inputGrid[0].length).fill(0)
        )
      }
    },
    setOutputGrid(state, grid) {
      state.currentOutputGrid = grid
    },
    updateOutputCell(state, { row, col, value }) {
      state.currentOutputGrid[row][col] = value
    },
    copyFromInput(state) {
      if (state.currentInputGrid) {
        state.currentOutputGrid = JSON.parse(JSON.stringify(state.currentInputGrid))
      }
    },
    resetOutputGrid(state) {
      if (state.currentInputGrid) {
        const height = state.currentInputGrid.length
        const width = state.currentInputGrid[0].length
        state.currentOutputGrid = Array(height).fill().map(() => Array(width).fill(0))
      }
    },
    resizeOutputGrid(state, { height, width, preserveContent, originalGrid }) {
      // Get current grid dimensions
      const currentGrid = state.currentOutputGrid;
      const currentHeight = currentGrid ? currentGrid.length : 0;
      const currentWidth = currentGrid && currentGrid.length > 0 ? currentGrid[0].length : 0;
      
      // Create a new grid with the requested dimensions
      const newGrid = Array(height).fill().map(() => Array(width).fill(0));
      
      // Preserve content from original grid when possible
      if (preserveContent && originalGrid) {
        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            // Copy existing cell values if they exist in the original grid
            if (i < originalGrid.length && j < originalGrid[0].length) {
              newGrid[i][j] = originalGrid[i][j];
            }
          }
        }
      }
      
      // Update the state
      state.currentOutputGrid = newGrid;
    },
    setSelectedSymbol(state, symbol) {
      state.selectedSymbol = symbol
    },
    setTasksMetadata(state, { subset, tasks }) {
      state.tasksMetadata = {
        ...state.tasksMetadata,
        [subset]: tasks
      }
      if (subset === state.currentSubset) {
        state.totalTaskCount = tasks.length
      }
    },
    // Set current user
    setCurrentUser(state, username) {
      state.currentUser = username;
      localStorage.setItem('arc-current-user', username);
    },
    
    // Add task completion
    saveCompletion(state, { taskId, time, transcript, user }) {
      // First check if we already have data for this task
      const storageKey = `arc-task-${taskId}`;
      let existingData = null;
      
      try {
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          existingData = JSON.parse(storedData);
        }
      } catch (e) {
        console.error("Error reading existing data:", e);
      }
      
      // Create new completion entry
      const newEntry = {
        time,
        transcript,
        user,
        timestamp: new Date().toISOString()
      };
      
      // Create or update completion data
      let completionData;
      
      if (existingData && existingData.entries) {
        // We already have a collection of entries
        completionData = existingData;
        completionData.entries.push(newEntry);
        
        // Update the "best" time if this is better
        if (!completionData.time || time < completionData.time) {
          completionData.time = time;
          completionData.user = user;
        }
      } else if (existingData) {
        // We have old format data, convert to new format
        const oldEntry = {
          time: existingData.time,
          transcript: existingData.transcript,
          user: existingData.user || 'Unknown',
          timestamp: existingData.timestamp || new Date().toISOString()
        };
        
        completionData = {
          taskId,
          time: Math.min(existingData.time || Infinity, time),
          user: time < (existingData.time || Infinity) ? user : (existingData.user || 'Unknown'),
          completed: true,
          entries: [oldEntry, newEntry]
        };
      } else {
        // First entry for this task
        completionData = {
          taskId,
          time,
          user,
          completed: true,
          entries: [newEntry]
        };
      }
      
      // Save to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(completionData));
        
        // Also update state
        if (!state.completedTasks) state.completedTasks = {};
        state.completedTasks[taskId] = completionData;
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }
    }
  },
  actions: {
      // Export all completion data to JSON file
    exportCompletionData({ getters }) {
      const allData = getters.getAllCompletionData;
      
      // Convert to JSON string with nice formatting
      const jsonData = JSON.stringify(allData, null, 2);
      
      // Create download link
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `arc-completions-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      return { success: true };
    },
    saveCompletion({ commit }, completionData) {
      commit('saveCompletion', completionData);
      return { success: true };
    },
    // Action to load saved data on app start
    initializeStore({ commit }) {
        commit('loadCompletionData');
        // Could also load last task, etc.
    },
    setArcVersion({ commit }, version) {
      commit('setArcVersion', version)
      return { success: true }
    },
    async loadTasksMetadata({ commit, getters }, subset) {
      try {
        const response = await axios.get(`${getters.apiEndpoint}/${subset}`)
        const tasks = response.data
        
        commit('setTasksMetadata', { subset, tasks })
        return { success: true, count: tasks.length }
      } catch (error) {
        console.error('Error loading tasks metadata:', error)
        return { success: false, error }
      }
    },
    async loadRandomTask({ commit, dispatch, state, getters }) {
      try {
        // First ensure we have metadata
        let totalCount = state.tasksMetadata[state.currentSubset]?.length
        
        if (!totalCount) {
          const metadataResult = await dispatch('loadTasksMetadata', state.currentSubset)
          if (!metadataResult.success) {
            return { success: false, error: 'Failed to load tasks metadata' }
          }
          totalCount = metadataResult.count
        }
        
        const tasks = state.tasksMetadata[state.currentSubset]
        const taskIndex = Math.floor(Math.random() * tasks.length)
        const task = tasks[taskIndex]
        
        const taskResponse = await axios.get(task.download_url)
        const { train, test } = taskResponse.data
        
        commit('setTask', {
          train,
          test,
          taskName: task.name,
          taskIndex,
          subset: state.currentSubset,
          totalCount
        })
        
        return { success: true }
      } catch (error) {
        console.error('Error loading random task:', error)
        return { success: false, error }
      }
    },
    async loadTask({ commit, dispatch, state, getters }, { taskIndex, subset }) {
      try {
        // First ensure we have metadata
        let tasks = state.tasksMetadata[subset]
        
        if (!tasks) {
          const metadataResult = await dispatch('loadTasksMetadata', subset)
          if (!metadataResult.success) {
            return { success: false, error: 'Failed to load tasks metadata' }
          }
          tasks = state.tasksMetadata[subset]
        }
        
        if (taskIndex < 0) {
          return { success: false, error: 'Task index cannot be negative', isNavigation: true }
        }
        
        if (taskIndex >= tasks.length) {
          return { success: false, error: 'You\'ve reached the last task', isNavigation: true }
        }
        
        const task = tasks[taskIndex]
        const taskResponse = await axios.get(task.download_url)
        const { train, test } = taskResponse.data
        
        commit('setTask', {
          train,
          test,
          taskName: task.name,
          taskIndex,
          subset,
          totalCount: tasks.length
        })
        
        return { success: true }
      } catch (error) {
        console.error('Error loading task:', error)
        return { success: false, error, isNavigation: true }
      }
    },
    async loadTaskFromFile({ commit }, file) {
      try {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          
          reader.onload = (e) => {
            try {
              const contents = JSON.parse(e.target.result)
              const { train, test } = contents
              
              commit('setTask', {
                train,
                test,
                taskName: file.name
              })
              
              resolve({ success: true })
            } catch (error) {
              reject({ success: false, error: 'Invalid JSON format' })
            }
          }
          
          reader.onerror = () => {
            reject({ success: false, error: 'Error reading file' })
          }
          
          reader.readAsText(file)
        })
      } catch (error) {
        console.error('Error loading task from file:', error)
        return { success: false, error }
      }
    }
  }
})
} 