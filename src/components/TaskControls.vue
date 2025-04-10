<template>
  <div class="task-controls card">
    <h2 class="card-title">Task Controls</h2>
    
    <div class="control-section">
      <h3 class="section-title">Current Task</h3>
      <div class="task-info">
        <div class="task-name" v-if="taskName">
          <span class="arc-version">{{ arcVersion }}</span>
          <span class="subset-prefix">[{{ currentSubset }}]</span> {{ taskName }}
        </div>
        <div class="task-navigation" v-if="taskName">
          <div class="counter-display">
            Task {{ currentTaskIndex > -1 ? currentTaskIndex + 1 : '1' }} / {{ totalTaskCount || '?' }}
          </div>
          <div class="nav-button-group">
            <button class="btn btn-small nav-btn" @click="$emit('previous-task')">
              <span class="material-icons">navigate_before</span> Previous
            </button>
            <button class="btn btn-small nav-btn" @click="$emit('next-task')">
              Next <span class="material-icons">navigate_next</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="control-section">
      <h3 class="section-title">Test Input Controls</h3>
      
      <div class="test-navigation">
        <div class="counter-display">
          Test {{ currentTestIndex + 1 }} / {{ totalTestCount }}
        </div>
        <div class="nav-button-group">
          <button 
            class="btn btn-small nav-btn"
            @click="$emit('previous-test')"
            :disabled="currentTestIndex <= 0"
          >
            <span class="material-icons">navigate_before</span> Previous
          </button>
          <button 
            class="btn btn-small nav-btn"
            @click="$emit('next-test')"
            :disabled="currentTestIndex >= totalTestCount - 1"
          >
            Next <span class="material-icons">navigate_next</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="control-section">
      <h3 class="section-title">Validate Solution</h3>
      
      <!-- Removed duplicate submit button -->
      
      <button 
        class="btn btn-secondary show-solution-btn" 
        @click="$emit('show-solution')"
      >
        <span class="material-icons">visibility</span> 
        Show Solution
      </button>
    </div>
    
    <div class="control-section">
    <h3 class="section-title">Solve Puzzle</h3>

    <div class="timer-display" v-if="timerStarted || formattedTimer !== '00:00'">
      Time: {{ formattedTimer }}
    </div>

     <button
       class="btn btn-primary start-btn"
       @click="$emit('start-timer')"
       :disabled="timerRunning" >
       <span class="material-icons">timer</span> Start Solving
     </button>

    <button
      class="btn btn-success validate-btn"
      @click="$emit('validate-solution')"
      :disabled="!timerRunning" >
      <span class="material-icons">check_circle</span>
      Submit Solution
    </button>
    </div>
    <div v-if="completionInfo.completed" class="completion-info">
    <p>
        <span class="material-icons success-icon">check_circle</span>
        Completed in: {{ formatTime(completionInfo.time) }}
    </p>
    <button class="btn btn-small" @click="showTranscript = !showTranscript">
        <span class="material-icons">description</span> {{ showTranscript ? 'Hide' : 'Show' }} Transcript
    </button>
    <div v-if="showTranscript" class="transcript-display">
        <h4>Transcript:</h4>
        <pre>{{ completionInfo.transcript }}</pre>
    </div>
  </div>
    <div class="control-section">
      <h3 class="section-title">Load Task</h3>
      
      <div class="load-options">
        <button class="btn" @click="$emit('random-task')">
          <span class="material-icons">shuffle</span> Random Task
        </button>
        
        <div class="or-divider">
          <span>OR</span>
        </div>
        
        <div class="file-upload">
          <label for="file-upload-input" class="btn btn-secondary">
            <span class="material-icons">upload_file</span> Upload JSON
          </label>
          <input 
            type="file" 
            id="file-upload-input" 
            @change="handleFileUpload" 
            accept=".json"
            style="display: none"
          >
        </div>
        
        <div class="or-divider">
          <span>OR</span>
        </div>
        
        <div class="manual-task-selection">
          <div class="arc-version-selector">
            <label for="arc-version-select">Challenge Version:</label>
            <select id="arc-version-select" v-model="selectedArcVersion" class="arc-select" @change="changeArcVersion">
              <option :value="1">ARC-AGI 1</option>
              <option :value="2">ARC-AGI 2</option>
            </select>
          </div>
          
          <div class="selection-controls">
            <select v-model="subset" class="subset-select">
              <option value="training">Training</option>
              <option value="evaluation">Evaluation</option>
            </select>
            
            <input 
              type="number" 
              v-model.number="taskIndex" 
              min="1" 
              class="task-index-input"
              placeholder="Task #"
            >
            
            <button class="btn" @click="loadSpecificTask">Load</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'TaskControls',
  props: {
    taskName: {
      type: String,
      default: ''
    },
    currentTaskIndex: {
      type: Number,
      default: -1
    },
    currentSubset: {
      type: String,
      default: 'training'
    },
    currentTestIndex: {
      type: Number,
      default: 0
    },
    totalTestCount: {
      type: Number,
      default: 0
    },
    totalTaskCount: {
      type: Number,
      default: 0
    },
    arcVersion: {
      type: String,
      default: 'ARC 2'
    },
    timerRunning: { type: Boolean, default: false },
    timerStarted: { type: Boolean, default: false },
    formattedTimer: { type: String, default: '00:00' }
  },
  emits: [
    'previous-task', 
    'next-task', 
    'random-task',
    'load-task',
    'load-file',
    'previous-test',
    'next-test',
    'validate-solution',
    'show-solution',
    'start-timer',
    'validate-solution',
  ],
  setup(props, { emit }) {
    const taskIndex = ref(props.currentTaskIndex >= 0 ? props.currentTaskIndex + 1 : 1) // Convert to 1-indexed
    const subset = ref(props.currentSubset)
    const showTranscript = ref(false);

    const store = useStore();
    const selectedArcVersion = ref(store.state.arcVersion)
    
    // Fixed task ID format to match what we store in local storage
    const currentTaskId = computed(() => 
      `${store.state.arcVersion}-${props.currentSubset}-${props.currentTaskIndex}`
    );
    
    const completionInfo = computed(() => 
      store.getters.getTaskCompletionData(currentTaskId.value) || { completed: false }
    );

    // Watch for changes in props to update local state
    watch(() => props.currentTaskIndex, (newValue) => {
      if (newValue >= 0) {
        taskIndex.value = newValue + 1; // Convert to 1-indexed
      }
    });
    
    watch(() => props.currentSubset, (newValue) => {
      subset.value = newValue;
    });
    
    const handleFileUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        emit('load-file', file)
      }
      // Clear the input value to allow selecting the same file again
      event.target.value = ''
    }
    
    const loadSpecificTask = () => {
      emit('load-task', { 
        taskIndex: taskIndex.value, // Will be converted to 0-indexed in parent component
        subset: subset.value
      })
    }
    
    const changeArcVersion = () => {
      store.dispatch('setArcVersion', selectedArcVersion.value)
      // Reset task index to 1 when changing versions
      taskIndex.value = 1
    }
    
    const formatTime = (seconds) => {
      if (!seconds && seconds !== 0) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    return {
      taskIndex,
      subset,
      selectedArcVersion,
      handleFileUpload,
      loadSpecificTask,
      changeArcVersion,
      completionInfo,
      currentTaskId,
      showTranscript,
      formatTime,
      store,
    }
  }
}
</script>