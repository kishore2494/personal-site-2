---
title: "Uncensored Multi-Agent AI Debate System locally with knowledge base: A Step-by-Step Guide with full code (Part 2)"
path: "/articles/uncensored-multi-agent-ai-debate-system-knowledge-base-part-2/"
date: 2025-07-02
last_modified_at: 2025-07-02T12:00:00-05:00
excerpt: "If you've been following along, you know that in Part 1, I shared how I built an autonomous, multi-agent AI debate system running completely on local LLMs with Ollama."
image: ""
categories: ['AI', 'Tutorial', 'RAG', 'Multi-Agent Systems']
tags: ['AI', 'Ai Agent', 'Llm', 'Artificial Intelligence', 'Technology']
toc: true
featured: false
draft: false
---

Hey folks! 👋

If you’ve been following along, you know that in [**Part 1**](https://medium.com/ai-simplified-in-plain-english/building-an-uncensored-multi-agent-ai-debate-system-locally-with-ollama-a-guide-with-full-code-359c7b85bd68), I shared how I built an autonomous, multi-agent AI debate system running completely on local LLMs with Ollama. Two agents, distinct roles, structured debate flow — all orchestrated on my own machine. It was an awesome starting point!

But there was a limitation…

The AI agents were arguing purely based on their general model knowledge. Which sounds cool — but let’s be honest, without specific, grounded information, their debates often drifted into vague, repetitive statements. That’s not how real debates work. You need facts. You need sources. You need your “mini library” ready to back your claims.

**Enter Part 2: Giving My AI Debaters a Knowledge Base.**

# **Recap: The Foundation from Part 1**

In Part 1, I built:

✅ Two AI debating agents (Affirmative & Negative)

✅ A Debate Orchestrator controlling the flow (opening → rebuttals → closing)

✅ Summarization to keep debate history concise

✅ All powered by local LLMs running via Ollama

### **If you missed that, check it out here:👉 [Part 1: Building the Autonomous AI Debate System](https://medium.com/ai-simplified-in-plain-english/building-an-uncensored-multi-agent-ai-debate-system-locally-with-ollama-a-guide-with-full-code-359c7b85bd68)**

[**Building an Uncensored Multi-Agent AI Debate System locally with Ollama: A Guide with Full CodeWhat if AI agents could debate like real humans — structured, timed, and even judged?” That’s the crazy thought that…**
medium.com](https://medium.com/ai-simplified-in-plain-english/building-an-uncensored-multi-agent-ai-debate-system-locally-with-ollama-a-guide-with-full-code-359c7b85bd68?source=post_page-----57e8d3189d76---------------------------------------)

### [**👉Part 3: Integration of UI for Debate System:**](https://medium.com/ai-simplified-in-plain-english/uncensored-multi-agent-ai-debate-system-locally-with-knowledge-base-now-with-a-ui-c5bae91525d3)

[**Uncensored Multi-Agent AI Debate System Locally with Knowledge Base Now with a UI!Like many in the tech sphere, I’ve been captivated by the rapid advancements in Artificial Intelligence, particularly…**
medium.com](https://medium.com/ai-simplified-in-plain-english/uncensored-multi-agent-ai-debate-system-locally-with-knowledge-base-now-with-a-ui-c5bae91525d3?source=post_page-----57e8d3189d76---------------------------------------)

# **Why Add a Knowledge Base?**

Imagine you’re preparing for a debate. You don’t just rely on your general memory — you research, you pull quotes, you cite studies. That’s what I wanted for my AI agents.

With a **Knowledge Base + Retrieval Augmented Generation (RAG)** setup, my agents can:

✅ Retrieve relevant information from stored documents (PDFs, notes, etc.)

✅ Incorporate that knowledge directly into their arguments

✅ Cite facts, not just hallucinate general knowledge

✅ Make debates richer, more factual, and grounded in actual sources

👉**Did you need to build your own separate RAG?**

[**Setting Up a Private Chat System(RAG) with LangChain, Ollama, and FAISS Vector Store: A…In this post, I’ll walk you through the process of building a sophisticated chat conversation system using…**
medium.com](https://medium.com/ai-simplified-in-plain-english/setting-up-a-private-chat-system-rag-with-langchain-ollama-and-faiss-vector-store-a-aa2fc999c344?source=post_page-----57e8d3189d76---------------------------------------)

# **Technical Overview: How the Knowledge-Driven Debate Works**

1. I load documents into a **vector database** using ChromaDB
2. Text chunks from those documents are converted to **embeddings** using Ollama
3. When it’s their turn, agents search the vector store for relevant chunks
4. Retrieved chunks are inserted into their LLM prompts
5. Their generated arguments now reflect both LLM knowledge *and* specific document knowledge
6. This is a classic RAG pipeline — but fully local and integrated with my multi-agent debate setup.

# **The Challenge: More Than Just Talking Bots**

Getting two simple chatbots to talk to each other is easy enough. But building agents that can hold a *structured debate* is a different beast. It requires:

1. **Distinct Roles:** Agents need to understand if they are Affirmative (arguing for the topic) or Negative (arguing against).
2. **Communication:** They need a way to pass arguments and information back and forth.
3. **State and Memory:** Agents need to remember what’s been said to build upon or rebut previous points.
4. **Coherence and Flow:** The debate needs to progress logically through different stages (opening, rebuttal, closing).
5. **Informed Arguments:** relying solely on a model’s general training data isn’t enough for a deep debate. They need access to specific information.
6. **Control:** Taming the potentially verbose or repetitive output of LLMs is essential.

Running this locally with Ollama added another layer: managing the resources needed for multiple concurrent or sequential LLM calls on my desktop hardware.

# **The Vision: A Miniature Virtual Debate Hall**

I envisioned a system where:

- A **Moderator** agent sets the stage and keeps time.
- **Affirmative** agents argue in favor of a given motion.
- **Negative** agents argue against it.
- (Optionally) A **Judge** agent analyzes the arguments presented.
- All agents use local Ollama models as their “brains.”
- Agents can refer to a local library of documents (my PDFs) to strengthen their points (this is where RAG comes in!).

Let’s get into how this system was built, step by step.

**Step 1: Laying the Groundwork — Structure and Configuration**

First, I needed to structure the project. Good software design principles apply just as much to AI projects. Separating concerns is key. I decided on a few core files:

- `config.py`: To hold all the tweakable settings – debate topic, model names, number of rounds, agent definitions, prompt templates, token limits, RAG settings. This makes experimenting easy.
- `debate_state.py`: A simple class to keep track of the debate as it happens – the topic and the chronological history of arguments.
- `agents.py`: The heart of the agent logic. This would contain base classes and specific classes for each type of agent, handling their interaction with the LLM.
- `rag_pipeline.py`: All the logic for loading documents, chunking, embedding, and setting up the vector database.
- `main.py`: The entry point to set up the debate, initialize agents, load the knowledge base, and start the orchestration.

```
# Project File Structure:
# project_root/
# ├── config.py
# ├── debate_state.py
# ├── agents.py
# ├── rag_pipeline.py
# ├── main.py
# └── knowledge/
#     ├── doc1.pdf
#     └── doc2.pdf
#     └── ...
# └── chroma_db/  # Directory for the vector store (will be created)
```

Let’s start filling these files with the initial setup and configuration.

**`config.py` (Initial Sketch with basic settings):**

```
# config.py

# --- Debate Configuration ---
DEBATE_TOPIC = "Should autonomous vehicles be implemented on a large scale within the next decade?"
NUMBER_OF_REBUTTAL_ROUNDS = 2

# --- Ollama Model Configuration ---
# Model we'll use for the agents. Make sure you have this pulled in Ollama!
DEFAULT_MODEL = 'dolphin-phi:latest'
SUMMARY_MODEL = DEFAULT_MODEL # Will use this for summarization later

# --- RAG Configuration (Will configure later) ---
KB_DIRECTORY = "./knowledge"
VECTOR_STORE_PATH = "./chroma_db"
EMBEDDING_MODEL = 'nomic-embed-text' # Make sure this is pulled in Ollama!
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
ENABLE_RAG = True # Toggle RAG on/off

# --- Agent Configuration ---
# Define each agent with their type, name, and optional model
AGENTS_CONFIG = [
    {'type': 'AffirmativeAgent', 'name': 'Affirmative Agent A', 'model': DEFAULT_MODEL},
    {'type': 'AffirmativeAgent', 'name': 'Affirmative Agent B', 'model': DEFAULT_MODEL},
    {'type': 'NegativeAgent', 'name': 'Negative Agent X', 'model': DEFAULT_MODEL},
    {'type': 'NegativeAgent', 'name': 'Negative Agent Y', 'model': DEFAULT_MODEL},
    {'type': 'JudgeAgent', 'name': 'The Honorable Judge', 'model': DEFAULT_MODEL, 'optional': True}
]

# --- Placeholder for Prompts (Will fill these in later) ---
AGENT_SYSTEM_PROMPTS = {}
STAGE_PROMPTS = {}
SUMMARY_PROMPT_TEMPLATE = ""
PROMPT_EXAMPLES = {}

# --- Placeholder for Token Limits (Will fill later) ---
MAX_TOKENS_PER_STAGE = {}
MAX_SUMMARY_TOKENS = 100
```

**`debate_state.py`(Keeping track of the history):**

```
# debate_state.py

class DebateState:
    """Holds the state of the debate, including the topic and history."""
    def __init__(self, topic: str):
        self.topic = topic
        self.history = [] # List of dictionaries: [{'agent': name, 'role': role, 'argument': text}]

    def add_argument(self, agent_name: str, agent_role: str, argument: str):
        """Adds an argument to the debate history."""
        self.history.append({
            'agent': agent_name,
            'role': agent_role,
            'argument': argument
        })

    def get_history_text(self) -> str:
        """Returns the full debate history as formatted text."""
        history_text = f"Debate Topic: {self.topic}\\n\\n-- Debate History --\\n"
        if not self.history:
            history_text += "No arguments yet.\\n"
        else:
            for entry in self.history:
                history_text += f"[{entry['role']} - {entry['agent']}]:\\n{entry['argument']}\\n\\n"
        history_text += "-- End of History --\\n"
        return history_text

    # This method is not strictly needed anymore with summarization, but useful for full transcript
    # def get_last_argument_text(self, from_role: str) -> str or None:
    #     """Returns the text of the last argument from a specific role."""
    #     for entry in reversed(self.history):
    #         if entry['role'] == from_role:
    #             return entry['argument']
    #     return None

    # This method is also not needed if using full history text or summary
    # def get_full_history_for_prompt(self) -> list:
    #     """Returns history formatted for Ollama's chat message list."""
    #     pass # Implementation depends on how you feed history to the LLM
```

**`main.py` (The orchestrator's control room - initial):**

```
# main.py

import time
from config import DEBATE_TOPIC, AGENTS_CONFIG, NUMBER_OF_REBUTTAL_ROUNDS, ENABLE_RAG # Add ENABLE_RAG later
from debate_state import DebateState
# Import agents and orchestrator later
# from agents import DebateOrchestrator, AffirmativeAgent, NegativeAgent, JudgeAgent, Agent
# Import RAG functions later
# from rag_pipeline import index_knowledge_base, get_retriever

# Placeholder mappings for creating agents from config
AGENT_TYPE_MAP = {}

def create_agent_instance(agent_config: dict, retriever=None): # Add retriever later
    """Creates an agent instance based on configuration."""
    # Implementation will go here
    pass # Placeholder

def main():
    """Sets up and runs the multi-agent debate with optional RAG."""

    print("--- Autonomous AI Debating Society ---", flush=True)

    # --- RAG Setup Placeholder ---
    retriever = None
    if ENABLE_RAG:
       # RAG setup logic will go here later
       pass

    debate_state = DebateState(topic=DEBATE_TOPIC)

    # --- Agent Creation Placeholder ---
    all_agents = []
    # Loop through AGENTS_CONFIG and create instances later

    # --- Orchestrator Creation Placeholder ---
    # orchestrator = DebateOrchestrator(...)

    # --- Run Debate Placeholder ---
    # if orchestrator:
    #     orchestrator.run_debate(num_rebuttal_rounds=NUMBER_OF_REBUTTAL_ROUNDS)

    print("--- Project Structure Initialized ---", flush=True) # Indicate completion of basic setup

if __name__ == "__main__":
    main()
```

With the basic structure in place, we can move on to the core intelligence.

**Step 2: Giving Agents a Voice (and Connecting to Ollama)**

The `agents.py` file needs a base `Agent` class that handles the interaction with Ollama. This is where we use the `ollama` Python library. We also need specific classes for each role inheriting from this base.

```
# agents.py

import ollama
import time
from config import (
    AGENT_SYSTEM_PROMPTS, STAGE_PROMPTS, DEFAULT_MODEL, SUMMARY_MODEL, # Add Summary Model later
    DEBATE_TOPIC, PROMPT_EXAMPLES, SUMMARY_PROMPT_TEMPLATE, # Add these later
    MAX_TOKENS_PER_STAGE, MAX_SUMMARY_TOKENS, ENABLE_RAG # Add these later
)
# Import for RAG contexts later
# from langchain.schema import Document

class Agent:
    """Base class for all agents in the system, handling Ollama interaction."""
    # Add retriever parameter later: def __init__(self, name: str, role_type: str, model: str = DEFAULT_MODEL, retriever=None):
    def __init__(self, name: str, role_type: str, model: str = DEFAULT_MODEL):
        self.name = name
        self.role_type = role_type # e.g., 'AffirmativeAgent', 'NegativeAgent', 'JudgeAgent'
        self.model = model
        # self.retriever = retriever # Store retriever here later

        # Get system prompt from config, format with topic if template exists
        self.system_prompt_template = AGENT_SYSTEM_PROMPTS.get(role_type)
        # Fallback for debate agents if needed
        if self.system_prompt_template is None and role_type not in ['DebateOrchestrator', 'JudgeAgent', 'Summarizer']:
             self.system_prompt_template = AGENT_SYSTEM_PROMPTS.get('DebateAgent')

        self.system_prompt = self.system_prompt_template.format(topic=DEBATE_TOPIC) if self.system_prompt_template else ""
        # print warnings later if no system prompt for certain types

    # Add stage, max_tokens, retrieved_context parameters later:
    # def generate_response(self, user_prompt: str, stage: str = None, max_tokens: int = -1, retrieved_context: str = "") -> str:
    def generate_response(self, user_prompt: str) -> str:
        """Sends a prompt to the Ollama model and returns the response."""

        messages = []
        if self.system_prompt:
             messages.append({'role': 'system', 'content': self.system_prompt})

        # Add few-shot examples here later if 'stage' is available

        # Add retrieved context here later if 'retrieved_context' is available

        # Add the actual prompt for the current turn
        messages.append({'role': 'user', 'content': user_prompt})

        # Ollama options (like max_tokens) go here later

        try:
            print(f"--- {self.name} ({self.role_type}) is thinking using model '{self.model}' ---", flush=True)
            response = ollama.chat(model=self.model, messages=messages, stream=False) # Add options=options later
            return response['message']['content'].strip()
        except ollama.ResponseError as e:
            print(f"Error from Ollama for {self.name}: {e}", flush=True)
            return f"ERROR: Agent failed to generate response due to Ollama error: {e}"
        except Exception as e:
             print(f"An unexpected error occurred for {self.name}: {e}", flush=True)
             return f"ERROR: Agent failed due to an unexpected error: {e}"

    def act(self, *args, **kwargs): # Use flexible arguments for now
        """Placeholder method for agent's action in a turn."""
        raise NotImplementedError("Subclasses must implement act method")

# Specific Agent Classes (Debating agents and Judge will inherit)
# Add debate_summary, retriever parameters later to act methods

class DebateAgent(Agent):
    """Base class for debating agents (Affirmative/Negative)."""
    # Add retriever parameter later: def __init__(self, name: str, role_type: str, stance: str, model: str = DEFAULT_MODEL, retriever=None):
    def __init__(self, name: str, role_type: str, stance: str, model: str = DEFAULT_MODEL):
        # Add retriever=retriever later: super().__init__(name, role_type, model, retriever=retriever)
        super().__init__(name, role_type, model)
        self.stance = stance # 'Affirmative' or 'Negative'

    # Add debate_state, stage, debate_summary parameters later
    def act(self, user_input: str) -> str:
        """Generates an argument based on simple user input (initial)."""
        # Call generate_response with the simple user input
        argument = self.generate_response(user_input) # Will add stage, max_tokens, context later
        return argument

class AffirmativeAgent(DebateAgent):
    """Agent arguing for the debate motion."""
    # Add retriever parameter later: def __init__(self, name: str, model: str = DEFAULT_MODEL, retriever=None):
    def __init__(self, name: str, model: str = DEFAULT_MODEL):
         # Add retriever=retriever later: super().__init__(name, 'AffirmativeAgent', 'Affirmative', model, retriever=retriever)
         super().__init__(name, 'AffirmativeAgent', 'Affirmative', model)

class NegativeAgent(DebateAgent):
    """Agent arguing against the debate motion."""
    # Add retriever parameter later: def __init__(self, name: str, model: str = DEFAULT_MODEL, retriever=None):
    def __init__(self, name: str, model: str = DEFAULT_MODEL):
         # Add retriever=retriever later: super().__init__(name, 'NegativeAgent', 'Negative', model, retriever=retriever)
         super().__init__(name, 'NegativeAgent', 'Negative', model)

class JudgeAgent(Agent):
    """Agent providing analysis at the end of the debate."""
    # Add retriever parameter later: def __init__(self, name: str, model: str = DEFAULT_MODEL, retriever=None):
    def __init__(self, name: str, model: str = DEFAULT_MODEL):
        # Add retriever=retriever later: super().__init__(name, 'JudgeAgent', model, retriever=retriever)
        super().__init__(name, 'JudgeAgent', model)

    # Add debate_state, debate_summary parameters later
    def act(self) -> str:
        """Generates an analysis (initial dummy)."""
        # Will generate analysis based on debate state later
        return "Judge is ready to analyze later."

class DebateOrchestrator(Agent):
    """Manages the flow of the debate."""
    # Add agent list parameter later: def __init__(self, name: str, debate_state: 'DebateState', agents: list[Agent], model: str = DEFAULT_MODEL):
    def __init__(self, name: str, debate_state: 'DebateState', agents=[]):
        super().__init__(name, 'DebateOrchestrator', model='llama3') # Moderator doesn't need a strong model for its core task
        self.debate_state = debate_state
        # Separate agents by role type later
        self.affirmative_agents = []
        self.negative_agents = []
        self.judge_agent = None # Judge is optional

        # Add agent processing logic here later

        self.turn_delay_seconds = 5 # Delay between turns

    def run_debate(self, num_rebuttal_rounds: int):
        """Runs the full debate sequence (initial dummy)."""
        print("--- Initializing Debate ---", flush=True)
        print(f"Topic: {self.debate_state.topic}\\n", flush=True)
        print("Debate structure will be implemented here later.", flush=True)
        # Add debate stages (opening, rebuttal, closing, judge) logic here later

        print("--- Debate Process Stub Complete ---", flush=True)

```

*(Self-correction: Initially, I put placeholder `pass` in the agent's `act` methods. It's better to make them raise `NotImplementedError` in the base class and add minimal dummy implementations or flexible arguments in subclasses that will be expanded later. Also, started adding parameters I know I'll need later, commented out initially.)*

With the core classes defined, `main.py` can now actually create these agents and the orchestrator.

**`main.py` (Connecting the pieces):**

```
# main.py

import time
from config import DEBATE_TOPIC, AGENTS_CONFIG, NUMBER_OF_REBUTTAL_ROUNDS, ENABLE_RAG, KB_DIRECTORY
from debate_state import DebateState
# Import all the agent classes
from agents import DebateOrchestrator, AffirmativeAgent, NegativeAgent, JudgeAgent, Agent
# Import RAG functions later
# from rag_pipeline import index_knowledge_base, get_retriever

# Mapping from config type string to Agent class
AGENT_TYPE_MAP = {
    'AffirmativeAgent': AffirmativeAgent,
    'NegativeAgent': NegativeAgent,
    'JudgeAgent': JudgeAgent,
}

# Add retriever parameter later: def create_agent_instance(agent_config: dict, retriever=None) -> Agent:
def create_agent_instance(agent_config: dict) -> Agent:
    """Creates an agent instance based on configuration."""
    agent_type_str = agent_config['type']
    agent_name = agent_config['name']
    agent_model = agent_config.get('model') # Use .get for optional model key

    agent_class = AGENT_TYPE_MAP.get(agent_type_str)
    if not agent_class:
        raise ValueError(f"Unknown agent type specified in config: {agent_type_str}")

    # Instantiate the agent
    if agent_model:
        # Pass retriever here later if agent needs it:
        # if agent_type_str in ['AffirmativeAgent', 'NegativeAgent']:
        #     return agent_class(name=agent_name, model=agent_model, retriever=retriever)
        # else: # Judge, etc. might not need retriever depending on design
        return agent_class(name=agent_name, model=agent_model)
    else:
        # Use default model, pass retriever later if needed
        # if agent_type_str in ['AffirmativeAgent', 'NegativeAgent']:
        #      return agent_class(name=agent_name, retriever=retriever)
        # else:
        return agent_class(name=agent_name) # Use default model from config

def main():
    """Sets up and runs the multi-agent debate with optional RAG."""

    print("--- Autonomous AI Debating Society ---", flush=True)

    # --- RAG Setup Placeholder (Will move real logic here) ---
    retriever = None
    if ENABLE_RAG:
       # RAG setup logic will go here later
       print("\\nRAG Enabled in config. Knowledge base will be indexed/loaded here.", flush=True)

    debate_state = DebateState(topic=DEBATE_TOPIC)

    # Create agent instances from config
    all_agents = []
    for agent_config in AGENTS_CONFIG:
        # Check if optional agent should be included (Currently always True for demonstration)
        if agent_config.get('optional', False) and not True: # Set to False to exclude optional agents
             continue # Skip this agent if optional and we choose not to include them
        try:
            # Pass the retriever here later: agent_instance = create_agent_instance(agent_config, retriever=retriever)
            agent_instance = create_agent_instance(agent_config)
            all_agents.append(agent_instance)
            print(f"Created agent: {agent_instance.name} ({agent_instance.role_type}) using model {agent_instance.model}", flush=True)
        except ValueError as e:
            print(f"Skipping agent configuration due to error: {e}", flush=True)
        except Exception as e:
             print(f"An unexpected error occurred creating agent {agent_config.get('name', 'Unknown')}: {e}", flush=True)

    # Create the orchestrator
    # The orchestrator needs the list of other agents
    try:
        orchestrator = DebateOrchestrator(
            name="The Moderator",
            debate_state=debate_state,
            agents=all_agents, # Pass the list of participating agents
            model='dolphin-phi:latest' # Orchestrator can use a model too
        )
        print(f"Created orchestrator: {orchestrator.name}", flush=True)
    except ValueError as e:
         print(f"Failed to create orchestrator: {e}. Exiting.", flush=True)
         return

    # Run the debate
    try:
        orchestrator.run_debate(num_rebuttal_rounds=NUMBER_OF_REBUTTAL_ROUNDS)
    except Exception as e:
        print(f"\\nAn error occurred during the debate execution: {e}", flush=True)

    print("--- Autonomous AI Debating Society Initialization Complete ---", flush=True)

if __name__ == "__main__":
    main()
```

Now running `python main.py` will initialize the agents but won't do much else, as the `run_debate` and agent `act` methods are just placeholders. Time to make them argue!

**Step 3: Orchestrating the Debate — The Moderator Takes Control**

The `DebateOrchestrator` needs to manage the flow: opening statements, rebuttal rounds, closing statements, and the judge. The `DebateAgent.act` method needs to be implemented to take the debate state and stage into account when formulating a prompt.

```
# agents.py (Update these classes)

# ... (rest of imports)

class Agent:
    """Base class for all agents in the system, handling Ollama interaction."""
    # Add retriever parameter later: def __init__(self, name: str, role_type: str, model: str = DEFAULT_MODEL, retriever=None):
    def __init__(self, name: str, role_type: str, model: str = DEFAULT_MODEL):
        self.name = name
        self.role_type = role_type
        self.model = model
        # self.retriever = retriever # Store retriever here later

        self.system_prompt_template = AGENT_SYSTEM_PROMPTS.get(role_type)
        if self.system_prompt_template is None and role_type not in ['DebateOrchestrator', 'JudgeAgent', 'Summarizer']:
             self.system_prompt_template = AGENT_SYSTEM_PROMPTS.get('DebateAgent')

        self.system_prompt = self.system_prompt_template.format(topic=DEBATE_TOPIC) if self.system_prompt_template else ""
        if not self.system_prompt and role_type not in ['DebateOrchestrator', 'Summarizer']:
             print(f"Warning: No system prompt template found for role type '{self.role_type}'", flush=True)

    # Add stage, max_tokens, retrieved_context parameters:
    # def generate_response(self, user_prompt: str, stage: str = None, max_tokens: int = -1, retrieved_context: str = "") -> str:
    def generate_response(self, user_prompt: str, stage: str = None) -> str: # Adding stage param for now
        """Sends a prompt to the Ollama model and returns the response."""

        messages = []
        if self.system_prompt:
             messages.append({'role': 'system', 'content': self.system_prompt})

        # Add few-shot examples here later using 'stage'
        # Add retrieved context here later if available

        messages.append({'role': 'user', 'content': user_prompt})

        # Ollama options (like max_tokens) go here later

        try:
            print(f"--- {self.name} ({self.role_type}) is thinking using model '{self.model}' ---", flush=True)
            response = ollama.chat(model=self.model, messages=messages, stream=False)
            return response['message']['content'].strip()
        except ollama.ResponseError as e:
            print(f"Error from Ollama for {self.name}: {e}", flush=True)
            return f"ERROR: Agent failed to generate response due to Ollama error: {e}"
        except Exception as e:
             print(f"An unexpected error occurred for {self.name}: {e}", flush=True)
             return f"ERROR: Agent failed due to an unexpected error: {e}"

    def act(self, debate_state, stage, *args, **kwargs): # Flexible args
        """Base act method for debate participation stages."""
        prompt_template = STAGE_PROMPTS.get(stage)
        if not prompt_template:
            return f"ERROR: Unknown debate stage '{stage}'"

        # Simple prompt formatting initially
        # This will become more complex with summary and context
        user_prompt = prompt_template.format(
             topic=debate_state.topic,
             debate_history=debate_state.get_history_text() # Passing full history for now
        )

        argument = self.generate_response(user_prompt, stage=stage) # Pass stage
        return argument

class DebateAgent(Agent):
    """Base class for debating agents (Affirmative/Negative)."""
    # Add retriever parameter later: def __init__(self, name: str, role_type: str, stance: str, model: str = DEFAULT_MODEL, retriever=None):
    def __init__(self, name: str, role_type: str, stance: str, model: str = DEFAULT_MODEL):
        # Add retriever=retriever later: super().__init__(name, role_type, model, retriever=retriever)
        super().__init__(name, role_type, model)
        self.stance = stance

class AffirmativeAgent(DebateAgent):
    """Agent arguing for the debate motion."""
    # Add retriever parameter later: def __init__(self, name: str, model: str = DEFAULT_MODEL, retriever=None):
    def __init__(self, name: str, model: str = DEFAULT_MODEL):
         # Add retriever=retriever later: super().__init__(name, 'AffirmativeAgent', 'Affirmative', model, retriever=retriever)
         super().__init__(name, 'AffirmativeAgent', 'Affirmative', model)

class NegativeAgent(DebateAgent):
    """Agent arguing against the debate motion."""
    # Add retriever parameter later: def __init__(self, name: str, model: str = DEFAULT_MODEL, retriever=None):
    def __init__(self, name: str, model: str = DEFAULT_MODEL):
         # Add retriever=retriever later: super().__init__(name, 'NegativeAgent', 'Negative', model, retriever=retriever)
         super().__init__(name, 'NegativeAgent', 'Negative', model)

class JudgeAgent(Agent):
    """Agent providing analysis at the end of the debate."""
    # Add retriever parameter later: def __init__(self, name: str, model: str = DEFAULT_MODEL, retriever=None):
    def __init__(self, name: str, model: str = DEFAULT_MODEL):
        # Add retriever=retriever later: super().__init__(name, 'JudgeAgent', model, retriever=retriever)
        super().__init__(name, 'JudgeAgent', model)

    # Update act method signature and logic
    # Add debate_state, debate_summary later: def act(self, debate_state: 'DebateState', debate_summary: str = None) -> str:
    def act(self, debate_state) -> str:
        """Generates an analysis based on the debate state."""
        stage = 'judge_analysis'
        prompt_template = STAGE_PROMPTS.get(stage)
        if not prompt_template:
            return f"ERROR: Judge analysis prompt template not found for stage '{stage}'."

        # Judge prompt initially uses full history, will use summary later
        user_prompt = prompt_template.format(debate_history=debate_state.get_history_text())

        # Pass stage when generating response
        analysis = self.generate_response(user_prompt, stage=stage)
        return analysis

class DebateOrchestrator(Agent):
    """Manages the flow of the debate."""
    def __init__(self, name: str, debate_state: 'DebateState', agents: list[Agent], model: str = 'llama3'): # Kept specific model for Orchestrator, less demanding
        super().__init__(name, 'DebateOrchestrator', model=model)
        self.debate_state = debate_state
        # Separate agents by role type for easier management
        self.affirmative_agents = [a for a in agents if isinstance(a, AffirmativeAgent)]
        self.negative_agents = [a for a in agents if isinstance(a, NegativeAgent)]
        self.judge_agent = next((a for a in agents if isinstance(a, JudgeAgent)), None) # Find the judge if exists

        if not self.affirmative_agents or not self.negative_agents:
            raise ValueError("Must have at least one Affirmative and one Negative agent configured.")

        self.turn_delay_seconds = 5 # Delay between turns
        # Add summary attributes later

    def run_debate(self, num_rebuttal_rounds: int):
        """Runs the full debate sequence."""
        print("--- Starting Debate ---", flush=True)
        print(f"Topic: {self.debate_state.topic}\\n", flush=True)

        # Stage 1: Opening Statements
        print("\\n--- Opening Statements ---", flush=True)
        # Use _run_stage helper
        self._run_stage('opening_statement', self.affirmative_agents)
        self._run_stage('opening_statement', self.negative_agents)

        # Stage 2: Rebuttal Rounds
        print(f"\\n--- Rebuttal Rounds ({num_rebuttal_rounds} rounds) ---", flush=True)
        for i in range(num_rebuttal_rounds):
            print(f"\\n--- Round {i+1} ---", flush=True)
            # Rebuttals
            self._run_stage('rebuttal', self.affirmative_agents)
            self._run_stage('rebuttal', self.negative_agents)

        # Stage 3: Closing Statements
        print("\\n--- Closing Statements ---", flush=True)
        self._run_stage('closing_statement', self.affirmative_agents)
        self._run_stage('closing_statement', self.negative_agents)

        # Stage 4: Judge Analysis (Optional)
        if self.judge_agent:
            print("\\n--- Judge Analysis ---", flush=True)
            # Call judge's act method
            analysis = self.judge_agent.act(self.debate_state) # Will pass summary later
            print(f"[{self.judge_agent.name} - {self.judge_agent.role_type}]:\\n{analysis}\\n", flush=True)

        print("--- Debate Concluded ---", flush=True)
        print("\\n--- Full Debate Transcript ---", flush=True)
        print(self.debate_state.get_history_text(), flush=True)

    def _run_stage(self, stage: str, agents: list[DebateAgent]): # Add debate_summary later
        """Helper to run a specific stage for a list of agents."""
        for agent in agents:
            print(f"\\n[{agent.role_type} - {agent.name}] speaking...", flush=True)
            # Call agent's act method
            argument_text = agent.act(self.debate_state, stage) # Will pass summary later
            # Add argument to history
            self.debate_state.add_argument(agent.name, agent.role_type, argument_text)
            print(f"[{agent.role_type} - {agent.name}]:\\n{argument_text}\\n", flush=True)
            time.sleep(self.turn_delay_seconds) # Pause between turns
```

And update `config.py` with the initial stage prompts:

**`config.py` (Adding initial prompts):**

```
# config.py

# ... (previous configurations remain the same)

# --- Agent Prompts (Base Instructions) ---
AGENT_SYSTEM_PROMPTS = {
    'DebateOrchestrator': (
        "You are a neutral debate moderator. Your role is to introduce the topic, "
        "call on speakers, maintain order, and conclude the debate. Do not offer your own opinions "
        "or arguments. Just manage the flow and report the arguments presented by the agents."
    ),
    'Summarizer': "You are a neutral summarization assistant...", # Placeholder, will refine later
    'DebateAgent': ( # Base prompt for both Affirmative and Negative
        "You are an AI debater participating in a structured debate. "
        "Your goal is to present compelling arguments for your assigned stance on the topic, "
        "and respectfully rebut the points made by the opposing side. "
        "Be clear, logical, and focus on the arguments." # Will add more instructions later
    ),
    'AffirmativeAgent': (
        "You are an AI debater on the AFFIRMATIVE team. Your task is to argue STRONGLY in favor of the debate motion: '{topic}'. "
        "Present arguments supporting this position and defend it against the Negative team's points. "
        "Remember the base instructions for an AI debater."
    ),
    'NegativeAgent': (
         "You are an AI debater on the NEGATIVE team. Your task is to argue STRONGLY against the debate motion: '{topic}'. "
         "Present arguments opposing this position and defend it against the Affirmative team's points. "
         "Remember the base instructions for an AI debater."
    ),
     'JudgeAgent': (
        "You are an AI judge observing a debate on the topic: '{topic}'. "
        "Your role is to analyze the arguments presented by both the Affirmative and Negative teams. "
        "At the end of the debate, you will provide a brief, impartial summary of the key points made by each side. "
        "Do not declare a 'winner' unless specifically asked to, and even then, base your judgment *solely* on the arguments presented in the debate transcript."
    )
}

# --- Specific Prompts for Debate Stages ---
# These prompts are sent to the agents during specific turns, in addition to their system prompt.
STAGE_PROMPTS = {
    'opening_statement': (
        "Deliver your opening statement. Introduce your main arguments supporting your stance on the topic.\\n\\n"
        "Full debate history so far:\\n{debate_history}" # Include full history initially
    ),
    'rebuttal': (
        "It is your turn to offer a rebuttal. Respond to the points made by the opposing team in their most recent arguments. Counter their claims and defend your own position.\\n\\n"
        "Full debate history so far:\\n{debate_history}" # Include full history initially
    ),
    'closing_statement': (
        "Deliver your closing statement. Summarize your main arguments and explain why your stance on the topic is the most compelling.\\n\\n"
        "Full debate history so far:\\n{debate_history}" # Include full history initially
    ),
    'judge_analysis': (
        "The debate has concluded. Here is the full transcript:\\n\\n{debate_history}\\n\\n"
        "Provide a brief, impartial summary of the key arguments made by the Affirmative team and the key arguments made by the Negative team. List the main points presented by each side."
    )
}

# --- Placeholder for Examples and Token Limits ---
PROMPT_EXAMPLES = {}
MAX_TOKENS_PER_STAGE = {}
MAX_SUMMARY_TOKENS = 100
```

Now, running `python main.py` should initiate a debate! You'll likely see some repetition and the quality won't be great yet, as we haven't added control or RAG, but the agents are talking and contributing to a shared history. This was the stage where I first saw the potential, but also the immediate need for better prompt engineering and context handling.

**Step 4: Taming the Output — Prompts, Limits, and Examples**

As you experienced, LLMs can be verbose and sometimes ignore instructions about format. This is where explicit prompting, token limits, and few-shot examples come in.

*(Self-correction: Grouping these related prompting techniques together makes more sense than separating them as individual “steps” since they work in combination.)*

We’ll refine the prompts in `config.py`, add `MAX_TOKENS_PER_STAGE` and `MAX_SUMMARY_TOKENS`, and add `PROMPT_EXAMPLES`. Then we update `agents.py` to use these.

**`config.py` (Adding detail to prompts, limits, and examples):**

(Use the full `config.py` from the previous detailed answer where we added conciseness instructions, token limits, and few-shot examples. It's too long to repeat here in full, but includes the `AGENT_SYSTEM_PROMPTS`, `STAGE_PROMPTS`, `SUMMARY_PROMPT_TEMPLATE`, `MAX_TOKENS_PER_STAGE`, `MAX_SUMMARY_TOKENS`, and `PROMPT_EXAMPLES` sections with explicit instructions for lists, token limits, and few-shot formatting examples).

**`agents.py` (Updating `generate_response` and `act` to use config details):**

(Use the full `agents.py` from the previous detailed answer where we updated `generate_response` to accept `stage` and `max_tokens`, added logic to include `PROMPT_EXAMPLES`, and modified `DebateAgent.act`, `JudgeAgent.act`, and `DebateOrchestrator._generate_summary` to pass/use these config values and parameters).

After making these changes, running `python main.py` should produce much more concise outputs, hopefully structured as lists. You might still hit errors if your hardware is stressed, which led me to the next challenge.

**Step 5: Managing Context — Remembering the Debate’s Core**

Passing the *full* debate history to the LLM every time becomes inefficient and counterproductive as the history grows. It increases prompt size (cost, latency, hitting context limits) and dilutes the LLM’s focus on the most recent, relevant points. The repetition issues you saw are a direct result of this.

The solution is to manage the context better. One effective way is using summarization. The Orchestrator (or a dedicated agent) summarizes the debate periodically, and agents receive the *summary* (plus perhaps the very last argument from the opponent) rather than the entire transcript.

*(Self-correction: I initially planned to implement this within `agents.py`, but it makes more sense for the Orchestrator to handle the cross-agent concern of summarizing the entire debate state.)*

We already added the framework for this in the previous code snippets (`SUMMARY_MODEL`, `SUMMARY_PROMPT_TEMPLATE` in config, and placeholders/updated signatures in agents). Now we add the implementation.

**`agents.py` (Adding Summarization Logic to Orchestrator and Agents):**

(Use the full `agents.py` from the answer where we implemented the `_generate_summary` method in `DebateOrchestrator` and modified `_run_stage`, `DebateAgent.act`, and `JudgeAgent.act` to call the summarizer and pass the `debate_summary` instead of the full history to the agent's `generate_response` call for relevant stages).

After this, the debate should run with summaries passed to the agents, keeping the prompt length more consistent after the opening statements and hopefully improving the relevance and reducing repetition in rebuttals.

**Step 6: Grounding Arguments in Knowledge — The RAG Pipeline**

Getting arguments to feel *informed* was the final major technical hurdle. LLMs know a lot, but they might not know the specifics needed for a particular debate topic based on *your* specific set of documents (like internal reports, specific studies, etc.). This calls for RAG.

The core idea: use a knowledge base to *retrieve* relevant text chunks based on the current context, and then *augment* the LLM’s prompt with this retrieved text.

We use LangChain and ChromaDB for this, leveraging Ollama for the embeddings.

**`rag_pipeline.py` (Building the Knowledge Base Management):**

(Use the full `rag_pipeline.py` code provided earlier. This file contains functions for `load_documents`, `split_text_into_chunks`, `create_embeddings`, `create_vector_store`, `load_vector_store`, `get_retriever`, and the main `index_knowledge_base` orchestrating function. It also includes the necessary imports from `langchain_community` and `ollama`.)

**`main.py` (Integrating RAG Setup):**

Now, modify `main.py` to run the `index_knowledge_base` process at the start and pass the resulting `retriever` to the agents.

(Use the full `main.py` code provided earlier. This includes the RAG setup block, the updated `create_agent_instance` to accept and pass the `retriever`, and passing `retriever=retriever` during the agent creation loop.)

**`agents.py` (Integrating Retrieval and Prompt Augmentation):**

Finally, update the `DebateAgent` (Affirmative and Negative) to use the retriever to fetch relevant text and include it in the prompt for `generate_response`. The base `Agent.generate_response` also needs to accept the retrieved context and format the final prompt correctly.

(Use the full `agents.py` code provided earlier. Key changes: `Agent.__init__` accepts `retriever`, `Agent.generate_response` accepts `retrieved_context` and formats the prompt message list, `DebateAgent.act` uses `self.retriever` to get relevant docs based on a query derived from debate state, and passes the formatted results as `retrieved_context` to `generate_response`. JudgeAgent is designed *not* to use the retriever for its analysis task in this setup).

Make sure to create the `knowledge` directory and put some PDFs in it!

**Running the Full Society**

With all the pieces in place, you can run the full multi-agent debate system:

```
pip install langchain pypdf chromadb ollama
ollama pull dolphin-phi:latest
ollama pull nomic-embed-text # If you used this embedding model
mkdir knowledge # Create the directory if it doesn't exist
# Put your PDF files inside the 'knowledge' directory
python main.py
```

You’ll see output indicating:

1. RAG setup (loading, splitting, potentially indexing, loading vector store).
2. Agent creation.
3. Debate starting.
4. Agents speaking in turn.
5. Orchestrator summarizing history periodically.
6. Agents querying the knowledge base before speaking (if RAG is enabled).
7. Agents formulating arguments based on summary and retrieved context.
8. Judge providing final analysis based on the summary.

**Lessons Learned and the Road Ahead**

Building this project taught me invaluable lessons:

- **Prompt Engineering is an Art:** Getting AIs to follow instructions precisely (like formatting, length) often requires careful prompt wording, few-shot examples, and parameter tuning (`num_predict`).
- **Context Management is Crucial:** LLMs have limits. Dumping raw, growing history leads to degradation. Techniques like summarization are vital for maintaining coherence in multi-turn interactions.
- **RAG Unlocks Possibilities:** Grounding LLMs in external data dramatically increases their utility and ability to make specific, informed arguments. It turns them from general knowledge engines into task-specific experts.
- **Local Development Challenges:** Running multiple LLM calls sequentially or near-concurrently can stress system resources, leading to errors or instability, especially with smaller models or less powerful hardware. Delays (`time.sleep`) can sometimes mitigate this.
- **Multi-Agent Coordination:** Designing the interaction patterns (who talks when, what information do they receive) is a key system design challenge.

This project is a solid foundation. Future enhancements could include:

- A User Interface (using Streamlit, Gradio, or a web framework) to make it interactive and visually display the debate.
- More sophisticated debate logic (e.g., agents forced to explicitly address specific points from the opponent).
- Using RAG to select *which* agent speaks next based on who can best rebut the previous point.
- Evaluating argument quality using another LLM or scoring mechanism.

# **What’s Next:Part-3 Interface and Refinements**

While the core multi-agent, local LLM, summarized context, and RAG system were built, the output was still just text in a console. The natural next step (which I’m exploring) is building a user interface.

- **Interface:** This means refactoring the code to *return* generated text from the agents and Orchestrator, instead of just printing it. A simple web framework like Streamlit or Flask would allow building a UI where the user can input the topic and see the debate unfold visually, turn by turn. This makes the project much easier to demo and share.

Further refinements include experimenting with:

- Different local models in Ollama.
- Tuning RAG parameters (chunk size, overlap, number of documents retrieved).
- More complex debate structures or agent interactions.
- Exploring agent memory more deeply than just summarization.

# **Conclusion: A Resume-Worthy Endeavor**

Building this system from scratch was an incredible learning experience. It went far beyond just calling an API; it involved designing a system architecture, managing inter-agent communication, tackling the nuances of LLM prompting, wrangling context windows, and integrating external knowledge sources through RAG.

If you’re looking for a project that covers significant ground in the current AI landscape for learning and resume building, diving into autonomous multi-agent systems with local LLMs and RAG is definitely worth considering.

Key Technical Takeaways for the Resume:

- **Multi-Agent System Design:** Understanding roles, communication, and orchestration.
- **Local LLM Operations (Ollama):** Experience running and interacting with models locally.
- **Prompt Engineering & Few-Shot Learning:** Guiding LLMs to perform specific tasks and output formats.
- **Context Management:** Techniques like summarization to handle conversation history limits.
- **Retrieval Augmented Generation (RAG):** Implementing pipelines for knowledge base integration (Loading, Chunking, Embedding, Vector Stores like ChromaDB, Retrieval).
- **Python Development:** Building modular and maintainable code.

This project transformed from a fun idea into a robust learning exercise that touches on many cutting-edge AI concepts. It shows the power of combining simple components (like agents and LLMs) into intelligent, autonomous systems.

Thanks for following along on this build! Feel free to check out the conceptual code structure — the real learning comes from diving in and experimenting yourself!

### **Related:**

[**Building a 2.54M Parameter Small Language Model with python: A Step -by-step GuideWelcome to this comprehensive guide on creating a small language model (LLM) using Python. In this tutorial, we will…**
medium.com](https://medium.com/ai-simplified-in-plain-english/building-a-2-54m-parameter-small-language-model-with-python-a-step-by-step-guide-0c0aceeae406?source=post_page-----57e8d3189d76---------------------------------------)

[**The Evolution of RAG: From Static to Self-Aware to AgenticAs someone who has spent significant time exploring the ever-evolving capabilities of artificial intelligence…**
medium.com](https://medium.com/ai-simplified-in-plain-english/the-evolution-of-rag-from-static-to-self-aware-to-agentic-c49994f3699b?source=post_page-----57e8d3189d76---------------------------------------)

---

![](https://miro.medium.com/v2/resize:fit:1400/1*_mXhiV6JnKgDFVW9-tpzSQ.png)