const winston = require('winston');
// Comment out OpenTelemetry to get the application running
// const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
// const { trace, context } = require('@opentelemetry/api');
// const { NodeSDK } = require('@opentelemetry/sdk-node');
// const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
// const { Resource } = require('@opentelemetry/resources');
// const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Provide mock implementations for OpenTelemetry functions
const trace = {
  getSpan: () => null,
  getTracer: () => ({
    startSpan: () => ({
      end: () => {},
      setAttribute: () => {},
      recordException: () => {},
      setStatus: () => {},
      spanContext: () => ({ traceId: 'mock-trace-id', spanId: 'mock-span-id' })
    })
  })
};

const context = {
  active: () => ({}),
  with: (ctx, fn) => fn()
};

// Create a tracer (mock implementation)
const tracer = {
  startSpan: (name) => ({
    end: () => {},
    setAttribute: () => {},
    recordException: () => {},
    setStatus: () => {},
    spanContext: () => ({ traceId: 'mock-trace-id', spanId: 'mock-span-id' })
  })
};

// Custom format for Winston logger
const logFormat = winston.format.printf(({ level, message, timestamp, traceId, spanId, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  
  // Add tracing information if available
  if (traceId) msg += ` [trace_id=${traceId}]`;
  if (spanId) msg += ` [span_id=${spanId}]`;
  
  msg += `: ${message}`;
  
  // Add additional metadata
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    logFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Database logger for important queries
const dbLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, operation, collection, executionTime, ...metadata }) => {
      let msg = `${timestamp} [${level}] [DB]`;
      
      if (operation) msg += ` [operation=${operation}]`;
      if (collection) msg += ` [collection=${collection}]`;
      if (executionTime) msg += ` [execution_time=${executionTime}ms]`;
      
      msg += `: ${message}`;
      
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      
      return msg;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Create trace context
const createTraceContext = () => {
  const currentSpan = trace.getSpan(context.active());
  if (!currentSpan) return {};
  
  const { traceId, spanId } = currentSpan.spanContext();
  return { traceId, spanId };
};

// Wrapper for logger to include trace context
const logWithTracing = (level, message, metadata = {}) => {
  const traceContext = createTraceContext();
  logger[level](message, { ...traceContext, ...metadata });
};

// Helper functions for common log levels
const info = (message, metadata) => logWithTracing('info', message, metadata);
const error = (message, metadata) => logWithTracing('error', message, metadata);
const warn = (message, metadata) => logWithTracing('warn', message, metadata);
const debug = (message, metadata) => logWithTracing('debug', message, metadata);

// Create a span and execute a function within it
const withSpan = async (name, fn, metadata = {}) => {
  const span = tracer.startSpan(name);
  
  // Set attributes on the span
  Object.entries(metadata).forEach(([key, value]) => {
    span.setAttribute(key, value);
  });
  
  try {
    // Execute the function with simplified context handling
    const result = await fn();
    span.end();
    return result;
  } catch (error) {
    // Record the error on the span
    span.recordException(error);
    span.setStatus({ code: 2, message: error.message }); // 2 = ERROR
    span.end();
    throw error;
  }
};

// Database logging helper
const logDbOperation = (operation, collection, executionTime, message, metadata = {}) => {
  const traceContext = createTraceContext();
  dbLogger.info(message, {
    ...traceContext,
    operation,
    collection,
    executionTime,
    ...metadata
  });
};

module.exports = {
  logger,
  dbLogger,
  info,
  error,
  warn,
  debug,
  withSpan,
  logDbOperation,
  tracer
}; 