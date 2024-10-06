class PriorityQueue {
    constructor() {
      this.elements = [];
    }
  
    enqueue(element, priority) {
      this.elements.push({ element, priority });
      this.elements.sort((a, b) => a.priority - b.priority);
    }
  
    dequeue() {
      return this.elements.shift().element;
    }
  
    isEmpty() {
      return this.elements.length === 0;
    }
  
    peek() {
      return this.elements[0];
    }
  }
  