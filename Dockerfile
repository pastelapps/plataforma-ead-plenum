FROM node:20-slim

RUN apt-get update && apt-get install -y \
    git curl bash vim \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code

WORKDIR /workspace

CMD ["bash"]
