const { logDbOperation } = require('./logger');

/**
 * Middleware for MongoDB operations to capture and log important database operations
 */
const setupMongooseTracing = (mongoose) => {
  // Important operations to log
  const OPERATIONS_TO_LOG = ['findOne', 'find', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'aggregate'];
  const EXECUTION_TIME_THRESHOLD = 100; // Only log operations that take longer than 100ms

  // Add query execution time plugin to mongoose
  mongoose.plugin((schema) => {
    OPERATIONS_TO_LOG.forEach((operation) => {
      schema.pre(operation, function() {
        this._startTime = Date.now();
        this._operation = operation;
      });

      schema.post(operation, function(doc) {
        const executionTime = Date.now() - this._startTime;
        
        // Only log operations that take longer than the threshold
        if (executionTime > EXECUTION_TIME_THRESHOLD) {
          // Get collection name from the model
          const collection = this.model.collection.collectionName;
          
          // Prepare query info for logging (strip sensitive data)
          const query = JSON.stringify(this.getQuery())
            .replace(/"password":"[^"]*"/g, '"password":"[REDACTED]"');
          
          logDbOperation(
            operation,
            collection,
            executionTime,
            `Slow ${operation} operation detected on ${collection}`,
            { query }
          );
        }
      });
    });
  });

  // Log all errors
  mongoose.connection.on('error', (err) => {
    logDbOperation(
      'connection',
      'all',
      0,
      'Database connection error',
      { error: err.message }
    );
  });

  // Log successful connection
  mongoose.connection.once('open', () => {
    logDbOperation(
      'connection',
      'all',
      0,
      'Database connected successfully',
      { host: mongoose.connection.host }
    );
  });
};

module.exports = setupMongooseTracing; 