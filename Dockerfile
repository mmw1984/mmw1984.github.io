# Use the official Nginx image as the base image
FROM nginx:alpine

# Copy the portfolio files to the Nginx HTML directory
COPY . /usr/share/nginx/html

# Expose port 3000 to the outside world
EXPOSE 3000

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
