import { TracerProvider } from '@opentelemetry/web';
import { context, trace } from '@opentelemetry/api';

// Configure tracing provider
const provider = new TracerProvider();
provider.register();

// Create a tracer
const tracer = trace.getTracer('tanyarat-frontend');

// Log levels
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

// Check if we should log this level
const shouldLog = (level) => {
  // In production, don't log debug messages
  if (process.env.NODE_ENV === 'production' && level === LogLevel.DEBUG) {
    return false;
  }
  return true;
};

// Format log message with timestamp and log level
const formatLogMessage = (level, message, traceId, spanId, metadata = {}) => {
  let formattedMsg = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  
  // Add tracing information
  if (traceId) formattedMsg += ` [trace_id=${traceId}]`;
  if (spanId) formattedMsg += ` [span_id=${spanId}]`;
  
  formattedMsg += `: ${message}`;
  
  // Add additional metadata
  if (Object.keys(metadata).length > 0) {
    formattedMsg += ` ${JSON.stringify(metadata)}`;
  }
  
  return formattedMsg;
};

// Get current tracing context
const getTraceContext = () => {
  const currentSpan = trace.getSpan(context.active());
  if (!currentSpan) return {};
  
  const { traceId, spanId } = currentSpan.spanContext();
  return { traceId, spanId };
};

// Base logger function
const logMessage = (level, message, metadata = {}) => {
  if (!shouldLog(level)) return;
  
  const { traceId, spanId } = getTraceContext();
  const formattedMessage = formatLogMessage(level, message, traceId, spanId, metadata);
  
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formattedMessage);
      break;
    case LogLevel.INFO:
      console.info(formattedMessage);
      break;
    case LogLevel.WARN:
      console.warn(formattedMessage);
      break;
    case LogLevel.ERROR:
      console.error(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
};

// Convenience methods for each log level
const debug = (message, metadata = {}) => logMessage(LogLevel.DEBUG, message, metadata);
const info = (message, metadata = {}) => logMessage(LogLevel.INFO, message, metadata);
const warn = (message, metadata = {}) => logMessage(LogLevel.WARN, message, metadata);
const error = (message, metadata = {}) => logMessage(LogLevel.ERROR, message, metadata);

// Create a span and execute a function within it
const withSpan = async (name, fn, metadata = {}) => {
  const span = tracer.startSpan(name);
  
  // Set attributes on the span
  Object.entries(metadata).forEach(([key, value]) => {
    span.setAttribute(key, value);
  });
  
  try {
    // Execute the function within the context of the span
    const result = await context.with(trace.setSpan(context.active(), span), fn);
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

// Track API calls with spans
const trackApiCall = async (url, method, options = {}, fn) => {
  return withSpan('api.request', async () => {
    const span = trace.getSpan(context.active());
    
    // Set span attributes for API call
    span.setAttribute('http.url', url);
    span.setAttribute('http.method', method);
    
    // Extract trace context to send to backend
    const { traceId, spanId } = span.spanContext();
    
    // Add trace headers to request
    const headers = {
      ...options.headers,
      'X-Trace-ID': traceId,
      'X-Span-ID': spanId,
    };
    
    // Log the API call
    info(`API ${method} request to ${url}`, { traceId, spanId });
    
    try {
      // Execute the actual API call
      const response = await fn({ ...options, headers });
      
      // Log successful response
      info(`API ${method} response from ${url}`, { 
        traceId, 
        spanId,
        status: response.status,
        statusText: response.statusText
      });
      
      return response;
    } catch (err) {
      // Log error response
      error(`API ${method} error from ${url}`, {
        traceId,
        spanId,
        error: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      throw err;
    }
  });
};

export {
  debug,
  info,
  warn,
  error,
  withSpan,
  trackApiCall,
  tracer,
  LogLevel
}; 