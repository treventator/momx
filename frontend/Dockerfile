# ===========================================
# MomX Frontend Dockerfile
# Nginx Static File Server
# ===========================================

# Use Nginx Alpine for smaller image
FROM nginx:1.25-alpine

# Install curl for healthcheck and remove default nginx configuration
RUN apk add --no-cache curl && rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static frontend files
COPY ./public /usr/share/nginx/html

# Create non-root user (optional, nginx runs as nginx user by default)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
