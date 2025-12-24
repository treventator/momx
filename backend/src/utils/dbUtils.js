const { logDbOperation } = require('./logger');

/**
 * Utility to log important MongoDB query performance
 */
class DbMonitor {
  /**
   * Logs important information about executed MongoDB queries
   * @param {string} operation - The operation type (e.g., 'find', 'update')
   * @param {string} collection - The collection name
   * @param {Object} query - The query parameters
   * @param {number} startTime - The timestamp when the operation started
   * @param {Object} result - The operation result
   * @param {string} traceId - Optional trace ID for distributed tracing
   */
  static logQueryPerformance(operation, collection, query, startTime, result, traceId = null) {
    const executionTime = Date.now() - startTime;
    
    // Only log slow queries (> 100ms) or queries that return large result sets
    const isSlowQuery = executionTime > 100;
    const isLargeResultSet = Array.isArray(result) && result.length > 100;
    
    if (isSlowQuery || isLargeResultSet) {
      // Sanitize query (remove sensitive fields)
      const sanitizedQuery = JSON.stringify(query)
        .replace(/"password":"[^"]*"/g, '"password":"[REDACTED]"')
        .replace(/"creditCard":"[^"]*"/g, '"creditCard":"[REDACTED]"');
      
      // Determine performance issue
      let performanceIssue = '';
      if (isSlowQuery) performanceIssue = 'slow query execution';
      if (isLargeResultSet) {
        performanceIssue += performanceIssue ? ', ' : '';
        performanceIssue += 'large result set';
      }
      
      // Log the operation details
      logDbOperation(
        operation,
        collection,
        executionTime,
        `Database performance issue (${performanceIssue})`,
        {
          query: sanitizedQuery,
          resultSize: Array.isArray(result) ? result.length : 'N/A',
          traceId
        }
      );
    }
  }
  
  /**
   * Logs database errors
   * @param {string} operation - The operation that caused the error
   * @param {string} collection - The collection name
   * @param {Error} error - The error object
   * @param {string} traceId - Optional trace ID for distributed tracing
   */
  static logError(operation, collection, error, traceId = null) {
    logDbOperation(
      operation,
      collection,
      0,
      `Database error: ${error.message}`,
      {
        errorStack: error.stack,
        errorCode: error.code,
        traceId
      }
    );
  }
  
  /**
   * Logs important schema changes
   * @param {string} collection - The collection being modified
   * @param {string} changeType - The type of schema change
   * @param {Object} details - Additional details about the schema change
   * @param {string} traceId - Optional trace ID for distributed tracing
   */
  static logSchemaChange(collection, changeType, details, traceId = null) {
    logDbOperation(
      'schemaChange',
      collection,
      0,
      `Schema change of type "${changeType}" detected`,
      {
        ...details,
        traceId
      }
    );
  }
  
  /**
   * Logs database connection changes
   * @param {string} event - The connection event
   * @param {Object} details - Connection details
   */
  static logConnection(event, details = {}) {
    logDbOperation(
      'connection',
      'all',
      0,
      `Database connection event: ${event}`,
      details
    );
  }
}

module.exports = DbMonitor; 