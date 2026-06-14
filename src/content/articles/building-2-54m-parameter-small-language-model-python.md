---
title: "Building a 2.54M Parameter Small Language Model with python: A Step -by-step Guide"
path: "/articles/building-2-54m-parameter-small-language-model-python/"
date: 2025-04-08
last_modified_at: 2025-04-08T12:00:00-05:00
excerpt: "Welcome to this comprehensive guide on creating a small language model (LLM) using Python. In this tutorial, we will walk through the entire process step-by-step, explaining each concept along the way"
image: ""
categories: ['AI', 'Tutorial', 'Python']
tags: ['Llm', 'AI', 'Artificial Intelligence', 'Python', 'Programming']
toc: true
featured: false
draft: false
---

Welcome to this comprehensive guide on creating a small language model (LLM) using Python. In this tutorial, we will walk through the entire process step-by-step, explaining each concept along the way. By the end of this post, you will have a working model that you can use for tasks like text generation.

# **Prerequisites**

Before we begin, ensure you have the following software installed:

- Python: Make sure you have Python 3.6 or above installed.
- Visual Studio Code (VS Code): Download and install it from [here](https://code.visualstudio.com/).
- Jupyter Extension for VS Code: Install this extension from the Extensions Marketplace within VS Code.

# **Overview of the Language Model**

A language model is a statistical model that predicts the likelihood of a sequence of words. For instance, it can generate text based on a given prompt by predicting the next word in a sequence. In this project, we will create a simple LLM that utilizes PyTorch for building and training the model.

# **Project Setup**

# **1. Required Libraries and Installation**

Let’s first install all the necessary libraries. Open your terminal and run the following command:

```
pip install torch numpy tokenizers tqdm matplotlib pandas datasets
```

# **2. Define Disk and RAM Requirements**

Make sure your system meets the following requirements:

- Disk Storage: Approximately 1.5–2 GB of free space.
- RAM Requirements:
- Training: 4–8 GB
- Inference: 1–2 GB

# **Step-by-Step Implementation in Jupyter Notebook**

Now, let’s create a new Jupyter Notebook in VS Code and write the model step-by-step.

# **Cell 1: Importing Libraries**

In the first cell, we’ll import the essential libraries required for our project.

```
# Import necessary libraries
import os
import time
import math
import random
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import Whitespace
from tokenizers.processors import TemplateProcessing
from tqdm import tqdm
import matplotlib.pyplot as plt
```

# **Explanation**

- os, time, math, random: Standard libraries for OS interaction, timing operations, mathematical functions, and generating random numbers.
- numpy: Used for numerical operations.
- torch: The core library of PyTorch used for tensor operations.
- nn: A sub-library of PyTorch for building neural networks.
- tokenizers: This library is crucial for handling text data. It will help in encoding text and managing vocabulary.

# **Cell 2: Set Random Seed**

To ensure reproducibility, set a random seed.

```
# Set random seeds for reproducibility
def set_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

set_seed(42)
```

# **Explanation**

Setting a random seed makes sure that the results can be reproduced, which is vital for model training.

# **Cell 3: Check Device**

Verify if your system can use a GPU for training; otherwise, it will fall back to using the CPU.

```
# Check device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")
```

# **Explanation**

If a GPU is available, it speeds up the processing significantly. Otherwise, it defaults to CPU.

# **Cell 4: Define the Model Architecture**

We will then define our model architecture. For this, we’ll create a simple transformer-like network.

```
# Simple Self-Attention Mechanism
class SimpleSelfAttention(nn.Module):
    def __init__(self, embed_dim, num_heads, dropout=0.1):
        super().__init__()
        assert embed_dim % num_heads == 0, "Embedding dimension must be divisible by number of heads"
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads

        self.q_proj = nn.Linear(embed_dim, embed_dim)
        self.k_proj = nn.Linear(embed_dim, embed_dim)
        self.v_proj = nn.Linear(embed_dim, embed_dim)
        self.out_proj = nn.Linear(embed_dim, embed_dim)
        self.dropout = nn.Dropout(dropout)
    def forward(self, x, attention_mask=None):
        batch_size, seq_len, _ = x.shape

        # Project input to query, key, and value
        q = self.q_proj(x).view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(x).view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(x).view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)

        # Scaled dot-product attention
        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim)
        if attention_mask is not None:
            scores += attention_mask
        attn = F.softmax(scores, dim=-1)
        attn = self.dropout(attn)

        # Aggregate values
        output = torch.matmul(attn, v).transpose(1, 2).contiguous().view(batch_size, seq_len, self.embed_dim)
        return self.out_proj(output)
```

# **Explanation**

- SimpleSelfAttention: This class defines a self-attention mechanism which is fundamental for capturing relationships in sequences. It includes:
- Query, Key, Value Projection: Each input is transformed into three different representations.
- Scaled Dot-Product: It calculates the attention scores by taking dot products of queries and keys.

# **Cell 5: Create the Dataset**

Now we’ll create a dataset class to handle loading and preparing the text data.

```
class TextDataset(Dataset):
    def __init__(self, file_path, tokenizer, block_size=128):
        with open(file_path, 'r', encoding='utf-8') as f:
            self.text = f.read()
        self.tokenizer = tokenizer
        self.block_size = block_size
    def __len__(self):
        return len(self.text) // self.block_size
    def __getitem__(self, idx):
        chunk = self.text[idx * self.block_size:(idx + 1) * self.block_size]
        return self.tokenizer.encode(chunk)
```

# **Explanation**

- TextDataset: This class reads the text file and splits it into blocks of a specified size for training. Each block is tokenized for model input.
- `__getitem__` method: This returns a specific chunk based on the index.

# **Cell 6: Initialize the Tokenizer**

Next, we need to initialize a tokenizer for the model.

```
# Initialize tokenizer
tokenizer = Tokenizer(BPE())
trainer = BpeTrainer(special_tokens=["[PAD]", "[CLS]", "[SEP]", "[UNK]", "[MASK]"])

# Train the tokenizer on text data
tokenizer.train(files=["input_text.txt"], trainer=trainer)
tokenizer.enable_truncation(max_length=128)
```

# **Explanation**

- BPE Tokenizer: Byte Pair Encoding (BPE) is used for dealing with the input text and managing vocabulary size.
- Special Tokens: These tokens are often used in transformers for various purposes such as padding and marking the start/end of sequences.

# **Cell 7: Data Loading Utility**

We’ll need a utility to collate the batch data.

```
def collate_batch(batch):
    """Collate function for DataLoader"""
    input_ids = torch.nn.utils.rnn.pad_sequence([item['input_ids'] for item in batch], batch_first=True, padding_value=tokenizer.token_to_id("[PAD]"))
    labels = torch.nn.utils.rnn.pad_sequence([item['labels'] for item in batch], batch_first=True, padding_value=-100)
    attention_mask = (input_ids != 0).float()
    return {'input_ids': input_ids, 'labels': labels, 'attention_mask': attention_mask}
```

# **Explanation**

- collate_batch: This function assembles data into batches, handles padding, and creates attention masks for the model.

# **Cell 8: Training the Model**

Now let’s define the training function.

```
def train(model, train_dataloader, num_epochs, lr, device):
    """Train the model"""
    optimizer = AdamW(model.parameters(), lr=lr)
    model.to(device)
    for epoch in range(num_epochs):
        model.train()
        for batch in train_dataloader:
            optimizer.zero_grad()
            input_ids = batch['input_ids'].to(device)
            labels = batch['labels'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            outputs = model(input_ids, attention_mask)
            loss = F.cross_entropy(outputs.view(-1, outputs.size(-1)), labels.view(-1), ignore_index=-100)
            loss.backward()
            optimizer.step()
            print(f"Epoch: {epoch + 1}, Loss: {loss.item()}")
```

# **Explanation**

- train function: This function handles the training process for the model. It:
- Uses an AdamW optimizer for gradient descent.
- Computes loss and performs backpropagation to optimize the model parameters.

# **Cell 9: Generating Text**

Now we will define a function to generate text using the trained model.

```
def generate_text(model, tokenizer, prompt, max_length=50, temperature=1.0, top_k=50, device='cpu'):
    model.eval()
    encoded = tokenizer.encode(prompt).ids
    input_ids = torch.tensor(encoded).unsqueeze(0).to(device)
for _ in range(max_length):
        outputs = model(input_ids)
        next_token_logits = outputs[:, -1, :] / temperature
        filtered_logits = top_k_filtering(next_token_logits, top_k)
        next_token = torch.multinomial(F.softmax(filtered_logits, dim=-1), num_samples=1)
        input_ids = torch.cat([input_ids, next_token], dim=1)
 if next_token.item() == tokenizer.token_to_id("[EOS]"):
            break

    return tokenizer.decode(input_ids[0].tolist())
```

# **Explanation**

- generate_text function: This function generates text based on a given prompt.
- It predicts the next token repeatedly until a specified maximum length is reached or an end-of-sequence token is generated.
- Uses temperature control and optional top-k filtering for randomness and diversity in text generation.

# **Cell 10: Main Execution Function**

Finally, we can create a function to run the entire training pipeline.

```
def run_training(data_path, num_epochs=3, lr=1e-4):
    tokenizer = Tokenizer(BPE())
    # Tokenizer training code here...
dataset = TextDataset(data_path, tokenizer)
    train_dataloader = DataLoader(dataset, batch_size=16, shuffle=True, collate_fn=collate_batch)
    model = SimpleSelfAttention(embed_dim=192, num_heads=3).to(device)
    train(model, train_dataloader, num_epochs, lr, device)
```

# **Explanation**

- run_training function: This function orchestrates the entire training process, from initializing the tokenizer to training the model.

# **Running the Notebook**

# **Step 1: Prepare Your Training Data**

Place your text dataset (for instance, `input_text.txt`) in the same directory as your Jupyter notebook.

# **Step 2: Execute Cells Sequentially**

Run each cell in the notebook one by one. Make sure to:

- Train your model only after reviewing and preparing your data.
- Adjust hyperparameters like `num_epochs` and `learning_rate` to see how they affect performance.

# **Training Time Expectations**

The training time will depend greatly on the dataset’s size and your hardware capabilities:

- With an Intel i3 laptop and 20GB of RAM, expect training times between 1 to 3 hours.
- **Recommended**: Use [Google Colab](https://colab.research.google.com/)/[Kaggle](https://www.kaggle.com/) to Run the code to reduce the time.

# **Inference**

Once the model is trained, use the `generate_text` function to see how well your model generates text based on prompts!

# **Conclusion**

Congratulations! You’ve successfully implemented a small language model using Python. This guide should serve as a foundation for further exploration into natural language processing and model training techniques. Feel free to experiment with the architecture and hyperparameters to see how they influence the model’s text generation abilities.

# **Further Exploration**

To deepen your understanding, consider:

- Experimenting with larger datasets.
- Fine-tuning the model with additional data.
- Trying different architectures or advanced techniques like transformer models.

**Connect with me on LinkedIn:** [here](http://www.linkedin.com/in/kishore-kumar-11184a196)

This concludes our guide! Don’t hesitate to reach out with any questions or for further assistance as you continue your journey in building language models. Happy coding!