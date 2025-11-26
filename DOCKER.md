# Blackbox Secure - Docker Deployment

## Build and Run

```bash
# Build the Docker image
docker build -t blackbox-secure .

# Run the container
docker run -p 3001:3001 blackbox-secure
```

The application will be available at `http://localhost:3001`

## Environment Variables

- `PORT` - Server port (default: 3001)

## Notes

- All data is stored in-memory and will be lost when the container restarts
- For production use, consider adding persistent storage or a database
