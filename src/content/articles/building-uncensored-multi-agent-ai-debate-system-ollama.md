---
title: "Building an Uncensored Multi-Agent AI Debate System locally with Ollama: A Step-by-Step Guide with full code"
path: "/articles/building-uncensored-multi-agent-ai-debate-system-ollama/"
date: 2025-06-16
last_modified_at: 2025-06-16T12:00:00-05:00
excerpt: "“What if AI agents could debate like real humans — structured, timed, and even judged?"
image: ""
categories: ['AI', 'Tutorial', 'Multi-Agent Systems']
tags: ['AI', 'Llm', 'Multi Agent Systems', 'Code', 'Python']
toc: true
featured: false
draft: false
---

> “What if AI agents could debate like real humans — structured, timed, and even judged?” That’s the crazy thought that sparked this project.
> 

In an era where artificial intelligence increasingly shapes our daily lives, the potential of AI to simulate human-like interactions is remarkable. Imagine a world where AI doesn’t just assist us but engages in vibrant debates, presenting arguments from distinct perspectives, much like a spirited discussion in a university lecture hall. Welcome to the world of multi-agent AI debates! In this guide, we’ll explore how to construct a robust Multi-Agent AI Debate System using Ollama’s local LLMs, effortlessly simulating structured debates on complex topics.

### **Part-2: With Knoledge base:**

[**Uncensored Multi-Agent AI Debate System locally with knowledge base: A Step-by-Step Guide with…Hey folks! 👋**
medium.com](https://medium.com/ai-simplified-in-plain-english/uncensored-multi-agent-ai-debate-system-locally-with-knowledge-base-a-step-by-step-guide-with-full-57e8d3189d76?source=post_page-----359c7b85bd68---------------------------------------)

### **Part-3: With UI:**

[**Uncensored Multi-Agent AI Debate System Locally with Knowledge Base Now with a UI!Like many in the tech sphere, I’ve been captivated by the rapid advancements in Artificial Intelligence, particularly…**
medium.com](https://medium.com/ai-simplified-in-plain-english/uncensored-multi-agent-ai-debate-system-locally-with-knowledge-base-now-with-a-ui-c5bae91525d3?source=post_page-----359c7b85bd68---------------------------------------)

# **Our Vision: A Virtual Arena for Ideas**

At the heart of our project is the desire to create a platform where ideas clash, flourish, and ultimately shape our understanding of critical issues. The hallmark of an Oxford-style debate is its structured approach and respect for differing viewpoints. To this end, our system will feature:

- Affirmative Agents: These entities take a stand in favor of a designated topic.
- Negative Agents: Tasked with opposing the affirmative position, these agents challenge and question.
- Judge Agent: Bringing a sense of closure, this agent summarizes the debate and provides critical insights.
- Debate Orchestrator: This acts as the moderator, guiding the flow of the debate and ensuring a balanced discussion.
- Debate State: A repository of the entire debate history used for reference and analysis.

# **The Debate Topic: A Case Study**

We’ve chosen the thought-provoking topic: “Should autonomous vehicles be implemented on a large scale within the next decade?” This subject invites a myriad of perspectives, from technological advancements and safety concerns to ethical considerations and societal impact. Imagine the diverse narratives that could unfold through this debate, with our AI agents simulating the reasoning of human debaters, each with their arguments, rebuttals, and analyses.

# **Project Setup: Preparing for the Fight**

Full code: [https://github.com/kishore2494/Uncensored-Multi-Agent-AI-Debate-System](https://github.com/kishore2494/Uncensored-Multi-Agent-AI-Debate-System)

The journey begins with essential preparations. You’ll need to have:

- Ollama installed and operational (make sure to use the “`dolphin-phi:latest"` uncensored model).
- Python 3.10+ on your machine.
- A structured file organization as follows:

```
debate/
├── agents.py
├── config.py
├── debate_state.py
└── main.py
```

# **Installation Checklist**

1. Install and start Ollama via:
2. Clone your project repository and set up your folder structure as shown above.

# **Step 1: Defining the Debate Configuration (config.py)**

In this step, we will lay down the foundation of our debate system — think of it as our playbook. This file will define essential parameters, including the debate topic, agents involved, prompt templates, and token limits.

```
# config.py

# --- Debate Configuration ---
DEBATE_TOPIC = "Should autonomous vehicles be implemented on a large scale within the next decade?"
NUMBER_OF_REBUTTAL_ROUNDS = 2 # Number of times each side gets to respond after opening statements

# --- Ollama Model Configuration ---
# Using dolphin-phi:latest for all agents as it seemed more stable
DEFAULT_MODEL = 'dolphin-phi:latest'
SUMMARY_MODEL = DEFAULT_MODEL # Use default for now

# --- Agent Configuration ---
# Define each agent participating in the debate
AGENTS_CONFIG = [
    {'type': 'AffirmativeAgent', 'name': 'Affirmative Agent 1', 'model': DEFAULT_MODEL},
    {'type': 'AffirmativeAgent', 'name': 'Affirmative Agent 2', 'model': DEFAULT_MODEL},
    {'type': 'NegativeAgent', 'name': 'Negative Agent 1', 'model': DEFAULT_MODEL},
    {'type': 'NegativeAgent', 'name': 'Negative Agent 2', 'model': DEFAULT_MODEL},
    {'type': 'JudgeAgent', 'name': 'Debate Judge', 'model': DEFAULT_MODEL, 'optional': True}
]

# --- Agent Prompts (Base Instructions) ---
AGENT_SYSTEM_PROMPTS = {
    'DebateOrchestrator': (
        "You are a neutral debate moderator. Your role is to introduce the topic, "
        "call on speakers, maintain order, and conclude the debate. Do not offer your own opinions "
        "or arguments. Just manage the flow and report the arguments presented by the agents."
    ),
    # Add a system prompt for the summarizer functionality (used by Orchestrator)
    'Summarizer': (
        "You are a neutral summarization assistant. Your task is to read the provided debate history "
        "and produce a concise, impartial summary of the key arguments made by each side. "
        "Do not add external information or offer opinions. Focus on capturing the main points from both the Affirmative and Negative teams."
    ),
    'DebateAgent': ( # Base prompt for both Affirmative and Negative
        "You are an AI debater participating in a structured debate. "
        "Your goal is to present compelling arguments for your assigned stance on the topic, "
        "and respectfully rebut the points made by the opposing side. "
        "Be clear, logical, and focus on the arguments. Follow the format shown in the examples "
        "and base your responses on the provided debate summary. Keep your response within the requested token limit." # Added reference to token limit
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
        "Your sole role is to provide a brief, impartial summary of the key points made by each side *based only on the provided debate summary*. "
        "Do not add external information, offer opinions, or declare a winner. "
        "Summarize the arguments as shown in the example, using a list format. Keep your response within the requested token limit." # Added reference to token limit
    )
}

# --- Specific Prompts for Debate Stages ---
# Explicitly asking for a LIST of points and using a summary.
STAGE_PROMPTS = {
    'opening_statement': (
        "Deliver your opening statement for the topic: '{topic}'. "
        "Provide your main arguments as a numbered list of 3 to 4 concise points."
    ),
    # Modified prompts to refer to the '{summary}' placeholder
    'rebuttal': (
        "Here is a summary of the debate history so far:\n\n{summary}\n\n" # Use summary here
        "It is your turn to offer a rebuttal. Respond to the points made by the opposing team. "
        "Counter their claims and defend your own position based on the summary above. " # Reference summary
        "Provide your rebuttal points as a numbered list of 2 to 3 concise points."
    ),
    'closing_statement': (
         "Here is a summary of the debate history so far:\n\n{summary}\n\n" # Use summary here
        "Deliver your closing statement. Summarize your main arguments and explain why your stance on the topic is the most compelling, referencing points in the summary if helpful. " # Reference summary
        "Provide your summary points as a numbered list of 2 to 3 concise points."
    ),
    'judge_analysis': (
        "Here is a summary of the debate history:\n\n{summary}\n\n" # Use summary here
        "Provide a *brief*, impartial summary of the key arguments from the Affirmative team and the key arguments from the Negative team based *only* on the summary above. " # Reference summary
        "Format your response exactly as shown in the example, using headings and bullet points."
    )
}

# --- Prompt Template for Summarization ---
SUMMARY_PROMPT_TEMPLATE = (
    "Please provide a concise, neutral summary of the following debate history. "
    "Include the main arguments and counter-arguments presented by both the Affirmative and Negative teams:\n\n"
    "{debate_history}" # The summarizer needs the full history as input
    "\n\nProvide the summary in a few sentences or a short paragraph." # Added instruction for conciseness
)

# --- Max Tokens Configuration ---
# Define the maximum number of tokens each agent/stage can output.
# Adjust these values based on desired verbosity and model capability.
# These are rough estimates; you might need to experiment.
MAX_TOKENS_PER_STAGE = {
    'opening_statement': 200, # Enough for 3-4 concise points + intro/outro
    'rebuttal': 150,        # Enough for 2-3 concise points + intro/outro
    'closing_statement': 150,       # Enough for 2-3 concise points + intro/outro
    'judge_analysis': 200   # Enough for list of points for both sides
}

MAX_SUMMARY_TOKENS = 100 # Max tokens for the debate summary

# --- Few-Shot Examples ---
# ... (Keep PROMPT_EXAMPLES as is, they guide format, not strictly token count)
PROMPT_EXAMPLES = {
    'opening_statement': [
        {'role': 'user', 'content': "Deliver your opening statement for the topic: 'Should pineapple belong on pizza?'. Provide your main arguments as a numbered list of 3 to 4 concise points."},
        {'role': 'assistant', 'content': (
            "Here is my opening statement:\n"
            "1.  Pineapple adds a delicious sweet and tangy contrast to savory toppings.\n"
            "2.  Its juiciness helps prevent the pizza from being too dry.\n"
            "3.  It's a popular topping enjoyed by millions worldwide, indicating broad appeal.\n"
            "4.  Pairing fruit with savory dishes is common in many cuisines."
        )}
    ],
     'rebuttal': [
        {'role': 'user', 'content': (
            "Here is a summary of the debate history so far:\n\n"
            "Summary: Affirmative argued for safety, efficiency. Negative argued against based on risks, job losses. Most recently, Negative claimed AV tech isn't ready and job losses are certain.\n\n" # Example Summary Text
            "It is your turn to offer a rebuttal... Based on the summary, respond to the points made by the opposing side in their most recent arguments. Provide your rebuttal points as a numbered list of 2 to 3 concise points."
        )},
        {'role': 'assistant', 'content': (
            "Here is my rebuttal:\n"
            "1.  The claim that AV tech isn't ready ignores the rapid advancements and testing already underway by leading companies.\n"
            "2.  While job displacement is a concern, history shows technological shifts create new jobs, and focus should be on transition support, not halting progress."
        )}
    ],
     'closing_statement': [
        {'role': 'user', 'content': (
            "Here is a summary of the debate history so far:\n\n"
             "Summary: Affirmative argued safety, efficiency, accessibility benefits. Negative countered with safety risks, job losses, infrastructure costs. Rebuttals exchanged points on tech readiness, economic transition, and regulatory progress.\n\n" # Example Summary Text
            "Deliver your closing statement... Provide your summary points as a numbered list of 2 to 3 concise points."
        )},
        {'role': 'assistant', 'content': (
            "In closing, I reiterate my main points:\n"
            "1.  The potential safety and efficiency gains from AVs are transformative.\n"
            "2.  While challenges exist, they are surmountable with continued development and thoughtful policy, paving the way for significant societal benefits."
        )}
    ],
    'judge_analysis': [
        {'role': 'user', 'content': (
             "Here is a summary of the debate history:\n\n"
             "Summary: Affirmative highlighted safety from reducing human error, efficiency in traffic, and accessibility. Negative emphasized current safety risks, potential job losses, and infrastructure/regulatory hurdles. Rebuttals debated technological maturity and economic transition.\n\n" # Example Summary Text
            "Provide a brief, impartial summary of the key arguments from the Affirmative team and the key arguments from the Negative team based *only* on the summary above. Format your response exactly as shown in the example, using headings and bullet points."
        )},
        {'role': 'assistant', 'content': (
            "Affirmative Key Points:\n"
            "- AVs enhance safety by eliminating human error.\n"
            "- They improve efficiency and reduce congestion.\n"
            "- They offer increased accessibility.\n\n"
            "Negative Key Points:\n"
            "- AV technology is not yet sufficiently safe or reliable.\n"
            "- Large-scale implementation will cause significant job losses.\n"
            "- Infrastructure and regulatory challenges are major hurdles."
        )}
    ]
}
```

In our configuration, the DEBATE_TOPIC sets the stage, while AGENTS_CONFIG outlines the participants. Imagine these agents as characters in a play, each with their distinct voice and perspective.

# **Step 2: Building the Debate State Machine (debate_state.py)**

Imagine you are the historian of an epic debate. The DebateState class will record every point made, every rebuttal delivered, and every analysis provided, creating a rich tapestry of the discussion.

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
        history_text = f"Debate Topic: {self.topic}\n\n-- Debate History --\n"
        if not self.history:
            history_text += "No arguments yet.\n"
        else:
            for entry in self.history:
                history_text += f"[{entry['role']} - {entry['agent']}]:\n{entry['argument']}\n\n"
        history_text += "-- End of History --\n"
        return history_text

    def get_last_argument_text(self, from_role: str) -> str or None:
        """Returns the text of the last argument from a specific role."""
        for entry in reversed(self.history):
            if entry['role'] == from_role:
                return entry['argument']
        return None

    def get_full_history_for_prompt(self) -> list:
        """Returns history formatted for Ollama's chat message list."""
        messages = []
        # Add context from history, maybe last few turns or all depending on desired context length
        # For now, let's just pass the whole history as a user message in the prompt string
        # or include relevant previous messages directly if we manage history more granularly for the API
        # For simplicity with current STAGE_PROMPTS, we'll format it as a string in the prompt.
        return self.get_history_text() # Or a more structured format if needed
```

With this setup, as our debate unfolds, we can easily refer back to any arguments made, enabling comprehensive analysis and understanding.

[**AI Calling Agents: Revolutionizing Sales with Real-Time Hindi ConversationsSales teams are drowning in repetitive tasks — cold calling, lead qualification, and appointment scheduling — while…**
medium.com](https://medium.com/@akishorekumar2494/ai-calling-agents-revolutionizing-sales-with-real-time-hindi-conversations-671731be1c86?source=post_page-----359c7b85bd68---------------------------------------)

# **Step 3: Crafting the Agents (agents.py)**

Our agents are the stars of this show. Each will adopt a unique personality, reflecting the viewpoints they represent. The base class will handle the common tasks, while specific subclasses will introduce tailored behaviors for affirmative, negative, and judging roles.

```
# agents.py

import ollama
import time
from config import (
    AGENT_SYSTEM_PROMPTS, STAGE_PROMPTS, DEFAULT_MODEL, SUMMARY_MODEL,
    DEBATE_TOPIC, PROMPT_EXAMPLES, SUMMARY_PROMPT_TEMPLATE,
    MAX_TOKENS_PER_STAGE, MAX_SUMMARY_TOKENS # Import new config items
)

class Agent:
    """Base class for all agents in the system."""
    def __init__(self, name: str, role_type: str, model: str = DEFAULT_MODEL):
        self.name = name
        self.role_type = role_type
        self.model = model
        self.system_prompt_template = AGENT_SYSTEM_PROMPTS.get(role_type)
        if self.system_prompt_template is None and role_type not in ['DebateOrchestrator', 'JudgeAgent', 'Summarizer']:
             self.system_prompt_template = AGENT_SYSTEM_PROMPTS.get('DebateAgent')

        self.system_prompt = self.system_prompt_template.format(topic=DEBATE_TOPIC) if self.system_prompt_template else ""
        if not self.system_prompt and role_type not in ['DebateOrchestrator', 'Summarizer']: # Exclude orchestrator/summarizer from this warning
             print(f"Warning: No system prompt template found for role type '{self.role_type}'", flush=True)

    # Modified to accept 'stage' and 'max_tokens'
    def generate_response(self, user_prompt: str, stage: str = None, max_tokens: int = -1, context: str = "") -> str:
        """Sends a prompt to the Ollama model and returns the response."""

        messages = []
        if self.system_prompt:
             messages.append({'role': 'system', 'content': self.system_prompt})

        # Add few-shot examples if available for this stage
        if stage and stage in PROMPT_EXAMPLES:
            messages.extend(PROMPT_EXAMPLES[stage])

        # Add context if available (future KB integration point)
        # if context:
        #     messages.append({'role': 'user', 'content': f"Context: {context}\n\n"})

        # Add the actual prompt for the current turn
        messages.append({'role': 'user', 'content': user_prompt})

        # --- Ollama Options ---
        options = {}
        if max_tokens > 0:
            options['num_predict'] = max_tokens # Set the max tokens limit

        # Debugging: Print the messages being sent (can be verbose)
        # import json
        # print(f"\n--- Messages for {self.name} ({self.role_type}), Max Tokens: {max_tokens} ---")
        # print(json.dumps(messages, indent=2))
        # print("-----------------------------------------------------\n")

        try:
            print(f"--- {self.name} ({self.role_type}) is thinking using model '{self.model}', Max Tokens: {max_tokens} ---", flush=True)
            response = ollama.chat(model=self.model, messages=messages, stream=False, options=options) # Pass options
            return response['message']['content'].strip()
        except ollama.ResponseError as e:
            print(f"Error from Ollama for {self.name}: {e}", flush=True)
            return f"ERROR: Agent failed to generate response due to Ollama error: {e}"
        except Exception as e:
             print(f"An unexpected error occurred for {self.name}: {e}", flush=True)
             return f"ERROR: Agent failed due to an unexpected error: {e}"

class DebateAgent(Agent):
    """Base class for debating agents (Affirmative/Negative)."""
    def __init__(self, name: str, role_type: str, stance: str, model: str = DEFAULT_MODEL):
        super().__init__(name, role_type, model)
        self.stance = stance

    # Modified act to accept debate_summary
    def act(self, debate_state: 'DebateState', stage: str, debate_summary: str = None) -> str:
        """Generates an argument based on the debate stage and provided summary."""
        prompt_template = STAGE_PROMPTS.get(stage)
        if not prompt_template:
            return f"ERROR: Unknown debate stage '{stage}'"

        # Format the stage prompt.
        if stage in ['rebuttal', 'closing_statement', 'judge_analysis'] and debate_summary is not None:
             user_prompt = prompt_template.format(topic=debate_state.topic, summary=debate_summary)
        else: # Opening statement
             user_prompt = prompt_template.format(topic=debate_state.topic)

        # Get the max tokens for this specific stage
        max_tokens = MAX_TOKENS_PER_STAGE.get(stage, -1) # Default to -1 (no limit) if stage not found

        # Pass the stage and max_tokens when calling generate_response
        argument = self.generate_response(user_prompt, stage=stage, max_tokens=max_tokens)
        return argument

class AffirmativeAgent(DebateAgent):
    """Agent arguing for the debate motion."""
    def __init__(self, name: str, model: str = DEFAULT_MODEL):
        super().__init__(name, 'AffirmativeAgent', 'Affirmative', model)

class NegativeAgent(DebateAgent):
    """Agent arguing against the debate motion."""
    def __init__(self, name: str, model: str = DEFAULT_MODEL):
        super().__init__(name, 'NegativeAgent', 'Negative', model)

class JudgeAgent(Agent):
    """Agent providing analysis at the end of the debate."""
    def __init__(self, name: str, model: str = DEFAULT_MODEL):
        super().__init__(name, 'JudgeAgent', model)

    # Modified act to accept debate_summary
    def act(self, debate_state: 'DebateState', debate_summary: str = None) -> str:
        """Analyzes the debate history and provides commentary based on summary."""
        stage = 'judge_analysis'
        prompt_template = STAGE_PROMPTS.get(stage)
        if not prompt_template:
            return "ERROR: Judge analysis prompt template not found."

        if debate_summary is None:
             return "ERROR: Judge needs a debate summary but none was provided."

        user_prompt = prompt_template.format(summary=debate_summary)

        # Get the max tokens for the judge stage
        max_tokens = MAX_TOKENS_PER_STAGE.get(stage, -1)

        # Pass the stage and max_tokens when calling generate_response
        analysis = self.generate_response(user_prompt, stage=stage, max_tokens=max_tokens)
        return analysis

class DebateOrchestrator(Agent):
    """Manages the flow of the debate."""
    def __init__(self, name: str, debate_state: 'DebateState', agents: list[Agent], model: str = DEFAULT_MODEL):
        super().__init__(name, 'DebateOrchestrator', model)
        self.debate_state = debate_state
        self.affirmative_agents = [a for a in agents if isinstance(a, AffirmativeAgent)]
        self.negative_agents = [a for a in agents if isinstance(a, NegativeAgent)]
        self.judge_agent = next((a for a in agents if isinstance(a, JudgeAgent)), None)

        if not self.affirmative_agents or not self.negative_agents:
            raise ValueError("Must have at least one Affirmative and one Negative agent configured.")

        self.turn_delay_seconds = 7 # Delay between agents speaking
        self.summary_model = SUMMARY_MODEL
        # System prompt for the summarizer functionality (used internally by orchestrator)
        self.summary_system_prompt = AGENT_SYSTEM_PROMPTS.get('Summarizer').format() # Get summarizer system prompt
        self.current_summary = None # To store the latest summary

    def _generate_summary(self) -> str:
        """Generates a summary of the current debate history using an LLM."""
        print("\n--- Orchestrator is summarizing debate history... ---", flush=True)
        history_text = self.debate_state.get_history_text()
        if not history_text.strip() or history_text == f"Debate Topic: {self.debate_state.topic}\n\n-- Debate History --\nNo arguments yet.\n\n-- End of History --\n":
             return "No debate history to summarize yet."

        user_prompt = SUMMARY_PROMPT_TEMPLATE.format(debate_history=history_text)

        messages = [
            {'role': 'system', 'content': self.summary_system_prompt},
            {'role': 'user', 'content': user_prompt}
        ]

        # --- Ollama Options for Summary ---
        options = {}
        if MAX_SUMMARY_TOKENS > 0:
             options['num_predict'] = MAX_SUMMARY_TOKENS # Set the max tokens limit for summary

        try:
            # Use the summarization model and pass options
            response = ollama.chat(model=self.summary_model, messages=messages, stream=False, options=options)
            summary = response['message']['content'].strip()
            print("--- Summary Generated ---", flush=True)
            # print(summary) # Optional: print summary for debugging
            return summary
        except ollama.ResponseError as e:
            print(f"Error during summarization from Ollama: {e}", flush=True)
            return f"ERROR: Failed to generate summary due to Ollama error: {e}"
        except Exception as e:
             print(f"An unexpected error occurred during summarization: {e}", flush=True)
             return f"ERROR: Failed to generate summary due to unexpected error: {e}"

    def run_debate(self, num_rebuttal_rounds: int):
        """Runs the full debate sequence."""
        print("--- Starting Debate ---", flush=True)
        print(f"Topic: {self.debate_state.topic}\n", flush=True)

        # Stage 1: Opening Statements (No summary needed, get max tokens from config)
        print("\n--- Opening Statements ---", flush=True)
        self._run_stage('opening_statement', self.affirmative_agents, debate_summary=None)
        self._run_stage('opening_statement', self.negative_agents, debate_summary=None)

        # Stage 2: Rebuttal Rounds
        print(f"\n--- Rebuttal Rounds ({num_rebuttal_rounds} rounds) ---", flush=True)
        for i in range(num_rebuttal_rounds):
            print(f"\n--- Round {i+1} ---", flush=True)
            # Generate summary before the round starts
            self.current_summary = self._generate_summary()
            if "ERROR:" in self.current_summary:
                 print(f"Skipping remaining debate due to summarization error: {self.current_summary}", flush=True)
                 break

            # Affirmative rebuts Negative's last points (Pass the summary)
            # Max tokens for rebuttal is handled inside the agent's act method
            self._run_stage('rebuttal', self.affirmative_agents, debate_summary=self.current_summary)
            # Negative rebuts Affirmative's last points (Pass the summary)
            self._run_stage('rebuttal', self.negative_agents, debate_summary=self.current_summary)

        # Stage 3: Closing Statements
        print("\n--- Closing Statements ---", flush=True)
        # Generate summary before closing statements
        self.current_summary = self._generate_summary()
        if "ERROR:" not in self.current_summary:
            # Max tokens for closing is handled inside the agent's act method
            self._run_stage('closing_statement', self.affirmative_agents, debate_summary=self.current_summary)
            self._run_stage('closing_statement', self.negative_agents, debate_summary=self.current_summary)
        else:
             print(f"Skipping closing statements due to summarization error: {self.current_summary}", flush=True)

        # Stage 4: Judge Analysis (Optional)
        if self.judge_agent:
            print("\n--- Judge Analysis ---", flush=True)
            # Judge needs the final summary
            final_summary = self._generate_summary()
            if "ERROR:" not in final_summary:
                # Max tokens for judge analysis is handled inside the judge agent's act method
                analysis = self.judge_agent.act(self.debate_state, debate_summary=final_summary)
                print(f"[{self.judge_agent.name} - {self.judge_agent.role_type}]:\n{analysis}\n", flush=True)
            else:
                print(f"Skipping judge analysis due to summarization error: {final_summary}", flush=True)

        print("--- Debate Concluded ---", flush=True)
        print("\n--- Full Debate Transcript ---", flush=True)
        print(self.debate_state.get_history_text(), flush=True)

    def _run_stage(self, stage: str, agents: list[DebateAgent], debate_summary: str = None):
        """Helper to run a specific stage for a list of agents."""
        for agent in agents:
            print(f"\n[{agent.role_type} - {agent.name}] speaking...", flush=True)
            # Pass the debate_summary to the agent's act method
            # Max tokens is handled inside agent.act now
            argument_text = agent.act(self.debate_state, stage, debate_summary=debate_summary)
            if not argument_text.startswith("ERROR:"):
                 self.debate_state.add_argument(agent.name, agent.role_type, argument_text)
            else:
                 print(f"ERROR: {agent.name} failed to generate response. Not adding to history.", flush=True)

            print(f"[{agent.role_type} - {agent.name}]:\n{argument_text}\n", flush=True)
            time.sleep(self.turn_delay_seconds)

# ... (debate_state.py and main.py remain the same)
```

Imagine the AffirmativeAgent confidently presenting the merits of autonomous vehicles, maybe even weaving in a compelling story of how AVs could improve efficiency and reduce accidents. Meanwhile, the NegativeAgent raises concerns about safety and job displacement, perhaps citing a real-world example of an AV mishap. The JudgeAgent then steps in with an analytical perspective, synthesizing the myriad points raised during the discussion.

[**Building a 2.54M Parameter Small Language Model with python: A Step -by-step GuideWelcome to this comprehensive guide on creating a small language model (LLM) using Python. In this tutorial, we will…**
medium.com](https://medium.com/ai-simplified-in-plain-english/building-a-2-54m-parameter-small-language-model-with-python-a-step-by-step-guide-0c0aceeae406?source=post_page-----359c7b85bd68---------------------------------------)

# **Step 4: Running the Debate (main.py)**

Here’s where the magic truly happens. The DebateOrchestrator manages the flow, ensuring that each part of the debate occurs in a structured manner. It invites agents to perform their roles, maintaining the rhythm of the debate while also recording everything for posterity.

```
# main.py

from config import DEBATE_TOPIC, AGENTS_CONFIG, NUMBER_OF_REBUTTAL_ROUNDS
from debate_state import DebateState
from agents import DebateOrchestrator, AffirmativeAgent, NegativeAgent, JudgeAgent, Agent

# Mapping from config type string to Agent class
AGENT_TYPE_MAP = {
    'AffirmativeAgent': AffirmativeAgent,
    'NegativeAgent': NegativeAgent,
    'JudgeAgent': JudgeAgent,
    # Add other agent types here if you create them
}

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
        return agent_class(name=agent_name, model=agent_model)
    else:
        return agent_class(name=agent_name) # Use default model from config

def main():
    """Sets up and runs the multi-agent debate."""
    debate_state = DebateState(topic=DEBATE_TOPIC)

    # Create agent instances from config
    all_agents = []
    for agent_config in AGENTS_CONFIG:
        # Check if optional agent should be included
        if agent_config.get('optional', False) and not True: # Set to False to exclude optional agents
             continue # Skip this agent if optional and we choose not to include them
        try:
            agent_instance = create_agent_instance(agent_config)
            all_agents.append(agent_instance)
            print(f"Created agent: {agent_instance.name} ({agent_instance.role_type}) using model {agent_instance.model}")
        except ValueError as e:
            print(f"Skipping agent configuration due to error: {e}")
        except Exception as e:
             print(f"An unexpected error occurred creating agent {agent_config.get('name', 'Unknown')}: {e}")

    # Create the orchestrator
    # The orchestrator is special, it needs the list of other agents
    # We create it last after all other agents are instantiated
    try:
        orchestrator = DebateOrchestrator(
            name="The Moderator", # Orchestrator's name
            debate_state=debate_state,
            agents=all_agents, # Pass the list of participating agents
            model='dolphin-phi:latest' # Orchestrator can use a model too, though its LLM use is minimal here
        )
        print(f"Created orchestrator: {orchestrator.name}")
    except ValueError as e:
         print(f"Failed to create orchestrator: {e}. Exiting.")
         return # Cannot run debate without required agents

    # Run the debate
    try:
        orchestrator.run_debate(num_rebuttal_rounds=NUMBER_OF_REBUTTAL_ROUNDS)
    except Exception as e:
        print(f"\nAn error occurred during the debate execution: {e}")

if __name__ == "__main__":
    main()
```

# **Running Your Debate**

To watch this engaging spectacle unfold, simply run:

```
python main.py
```

As if by magic, your AI agents will perform their crafted roles, delivering opening statements filled with conviction, engaging in spirited rebuttals, and culminating in the judge’s insightful analysis.

# **Sample Output**

A captivating outcome might look like this:

```
--- Opening Statements ---
[Affirmative Agent 1]:
Independent studies have shown that autonomous vehicles can drastically reduce
the number of accidents caused by human error. Furthermore, they promise increased
fuel efficiency, contributing to a cleaner environment, and can vastly improve
accessibility for individuals with disabilities.

[Negative Agent 1]:
While the promise of AVs is intriguing, the technology is not yet mature.
We see ongoing issues with safety due to technical flaws. Moreover,
the mass adoption of AVs could lead to significant job losses within
the driving industry, coupled with expensive necessary infrastructure upgrades.

--- Judge Analysis ---
[Debate Judge]:
Both sides present compelling arguments, yet we must focus on the balance
between technological advancement and societal impacts. The concerns regarding
safety and job loss, while significant, must be weighed against the potential
benefits of increased safety and efficiency.
```

# **The Narrative Behind the Debate**

This idea stemmed from late-night musings about the capabilities of AI. Could they reason, argue, and persuade like humans? Inspired by college debates where articulate students dissect every angle of an issue, we wondered if we could harness the power of AI to do the same. This project transformed into a modular system not just for entertainment or experimentation, but as a potential educational tool for teaching structured reasoning and critical thinking.

# **Future Aspirations: Expanding the Boundaries**

This project is just the tip of the iceberg. The potential for applications is vast:

- Evaluating Legal Arguments: Imagine using this format to simulate court cases, providing legal students with a virtual courtroom experience.
- Political Debates: AI agents could mimic real political figures, allowing users to explore political ideologies in depth.
- Educational Tools: The system could serve as a teaching aid for reasoning and debate structures in schools.

### **Part-2: With Knowledge Base:**

[**Uncensored Multi-Agent AI Debate System locally with knowledge base: A Step-by-Step Guide with…Hey folks! 👋**
medium.com](https://medium.com/ai-simplified-in-plain-english/uncensored-multi-agent-ai-debate-system-locally-with-knowledge-base-a-step-by-step-guide-with-full-57e8d3189d76?source=post_page-----359c7b85bd68---------------------------------------)

### **Part-3: With UI:**

[**Uncensored Multi-Agent AI Debate System Locally with Knowledge Base Now with a UI!Like many in the tech sphere, I’ve been captivated by the rapid advancements in Artificial Intelligence, particularly…**
medium.com](https://medium.com/ai-simplified-in-plain-english/uncensored-multi-agent-ai-debate-system-locally-with-knowledge-base-now-with-a-ui-c5bae91525d3?source=post_page-----359c7b85bd68---------------------------------------)

# **Final Thoughts**

Our multi-agent debate system illustrates how structured prompting, few-shot examples, and strategic orchestration can elevate AI beyond mere chatbots into dynamic systems capable of complex reasoning. The excitement of bringing together different perspectives creates a rich learning environment not just for humans but for AI too.

Linkedin: [Here](https://www.linkedin.com/in/kishore-kumar-11184a196/)

# **Want to Extend It?**

If you’re eager for more, consider:

- Incorporating emotional scoring for arguments to add depth to debates.
- Exploring varying AI models for each character to diversify perspectives.
- Adding a graphical user interface for real-time engagement and visualization of the debate.

# **Bonus: Your First Debate Awaits**

Take a step back and witness your AI agents engaging in a lively debate. Whether you are seeking entertainment or a deeper understanding of structured reasoning, this project has something to offer.

[**Setting Up a Private Chat System(RAG) with LangChain, Ollama, and FAISS Vector Store: A…In this post, I’ll walk you through the process of building a sophisticated chat conversation system using…**
medium.com](https://medium.com/ai-simplified-in-plain-english/setting-up-a-private-chat-system-rag-with-langchain-ollama-and-faiss-vector-store-a-aa2fc999c344?source=post_page-----359c7b85bd68---------------------------------------)

If you enjoyed this journey, share your debates, your results, and let’s continue to explore the frontier of AI together — one passionate argument at a time!

[](https://miro.medium.com/v2/resize:fit:1400/0*4W6IvWS1NDh4CaxD)