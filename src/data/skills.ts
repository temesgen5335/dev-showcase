export const skillGroups = [
  {
    group: "Languages",
    items: ["Python (3y)", "JavaScript (3y)", "SQL (3y)", "TypeScript (2y)", "Java (2y)", "Go (1y)"],
  },
  {
    group: "Frameworks",
    items: ["FastAPI (3y)", "React (3y)", "Next.js (2y)", "Django (2y)", "Flask (2y)", "Svelte (1y)", "Angular (1y)"],
  },
  {
    group: "AI / ML",
    items: [
      "TensorFlow",
      "PyTorch",
      "scikit-learn",
      "LangChain",
      "LlamaIndex",
      "LangGraph",
      "OpenCV",
      "Hugging Face Transformers",
      "NLTK",
      "Streamlit",
    ],
  },
  {
    group: "DevOps & MLOps",
    items: ["Docker", "MLflow", "DVC", "Apache Airflow", "Apache Kafka", "CI/CD", "n8n"],
  },
  {
    group: "Databases",
    items: ["PostgreSQL", "MongoDB", "MySQL", "FAISS", "Weaviate"],
  },
  {
    group: "Cloud",
    items: ["AWS", "Azure", "Vercel"],
  },
  {
    group: "Techniques",
    items: [
      "Prompt Engineering",
      "RAG",
      "Agentic systems",
      "Computer Vision",
      "CNN",
      "RNN",
      "NLP",
      "EDA",
      "Time-series forecasting",
    ],
  },
] as const;

export const certifications = [
  { name: "AI Fundamentals", issuer: "IBM", href: "https://www.credly.com/org/ibm/badge/artificial-intelligence-fundamentals" },
  { name: "Machine Learning", issuer: "Kaggle", href: "https://www.kaggle.com/learn/certification/intermediate-machine-learning" },
  { name: "Data Analysis", issuer: "Udacity", href: "https://graduation.udacity.com/" },
  { name: "Python Programming", issuer: "Udemy", href: "https://www.udemy.com/certificate/" },
  { name: "Cybersecurity", issuer: "Cisco", href: "https://www.credly.com/org/cisco/badge/" },
] as const;

export const education = [
  {
    school: "Addis Ababa University",
    degree: "BSc in Information Systems",
    location: "Addis Ababa, Ethiopia",
    end: "2023",
    href: "http://www.aau.edu.et/",
  },
  {
    school: "10 Academy",
    degree: "AI / ML Engineering Program",
    location: "Remote",
    end: "2024",
    href: "https://www.10academy.org/",
  },
] as const;
