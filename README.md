# Welcome to HearMeOut

HearMeOut is a conversational tool designed to help users improve their interview answers by providing insightful feedback and tailored perspectives based on their resume and job descriptions. This iterative tool guides users through a conversation, generating interview questions and crafting tailored responses to enhance preparation.

---

## Project Description

The goal of this project is to implement a conversation tool that follows these steps:

1. **Gemini** (our chatbot) begins each round of the conversation.
2. **User** interacts by providing responses to Gemini’s prompts.
3. **Gemini** (our chatbot) takes audio input and prompts to respond in user's voice

### Example Conversation Flow:

**Gemini:** Hi, this is HearMeOut. We are providing new perspectives on your interview answers. First, please copy and paste your resume here.  
**User:** <Enters resume>

**Gemini:** What job position are you applying for? You can provide specific job descriptions.  
**User:** <Enters job>

**Gemini:** What type of interview questions are you expecting? We will provide 3 sample questions based on your response.  
**User:** <Enter question type>

**Gemini:**
1. <Question1>  
2. <Question2>  
3. <Question3>  
**User:** <Enters number (1-3)>

**Gemini:** Circling back to the last question. You also have the option to "restart."  
**User:** <Enters number (1-3) or restart>

**Gemini** generates approximately 30-second responses (around 3-4 sentences) tailored to your background and the job description.

- - -

## Getting Started

Follow these steps to set up and run HearMeOut locally:

### Clone the Repository:
```sh
# Clone the repository using the project's Git URL
 git clone <repository-url>
```

### Install Dependencies:
```sh
# Install the necessary dependencies
npm i
```

### Start the Development Server:
```sh
# Start the development server with auto-reloading and an instant preview
npm run dev
```

---

## Technologies Used

This project is built using:

- **Vite** for fast builds and optimized development.
- **TypeScript** for type safety and enhanced developer experience.
- **React** for the user interface.
- **shadcn-ui** for reusable components.
- **Tailwind CSS** for responsive and utility-first styling.

---

## Contributors

This project is made in collaboration with:

- **Neel Bullywon** (University of Waterloo)  
  Email: [neel.bullywon@uwaterloo.ca](mailto:neel.bullywon@uwaterloo.ca)

- **Rolland He** (University of Toronto)  
  Email: [rolland.he@mail.utoronto.ca](mailto:rolland.he@mail.utoronto.ca)

- **Sanjeev Kalagony** (University of Waterloo)   
  Email: [skalagon@uwaterloo.ca](mailto:skalagon@uwaterloo.ca)

- **Hank Shi** (University of Waterloo)  
  Email: [hdshi@uwaterloo.ca](mailto:hdshi@uwaterloo.ca)

---

## Future Plans 

- Improve Gemini’s AI-driven response generation.
- Add support for personalized feedback loops.
- Expand question types and job description parsing capabilities.

---

Thank you for using HearMeOut! Together, let’s elevate your interview performance to the next level.

