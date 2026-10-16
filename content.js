// Learning content. Edit freely: add entries to REVIEW / RETRIEVAL and the carousel picks them up.
// topic ids must exist in TOPICS.

window.TOPICS = {
  ds:      { label: "Data Science" },
  ml:      { label: "Machine Learning" },
  torch:   { label: "PyTorch" },
  ksprod:  { label: "Karl Storz Products" },
  kssales: { label: "Karl Storz Sales" },
  ai:      { label: "AI Terminology" },
  llm:     { label: "LLM Terminology" },
  harness: { label: "Harness" },
};

// Review: short term + definition (+ optional "why it matters").
window.REVIEW = [
  // ---- Data Science
  { topic: "ds", term: "Min-max normalization", def: "Rescales a feature to a fixed range, usually [0, 1], using its observed minimum and maximum.", note: "Sensitive to outliers: one extreme value squashes everyone else." },
  { topic: "ds", term: "Standardization (z-score)", def: "Centers a feature at mean 0 with standard deviation 1: z = (x − μ) / σ.", note: "Preferred when features are roughly Gaussian or the model assumes centered inputs." },
  { topic: "ds", term: "Data leakage", def: "Information from outside the training set (e.g. the test set or the future) sneaks into model training, inflating metrics.", note: "Fit scalers and imputers on training data only." },
  { topic: "ds", term: "Class imbalance", def: "One class is far rarer than another (e.g. 1% of patients have the condition), so accuracy becomes misleading.", note: "Use precision, recall, PR-AUC, or resampling / class weights." },
  { topic: "ds", term: "Precision vs. recall", def: "Precision = TP / (TP + FP): of predicted positives, how many are real. Recall = TP / (TP + FN): of real positives, how many we found.", note: "Screening tools in healthcare usually favor recall." },
  { topic: "ds", term: "Confounding variable", def: "A third variable that influences both the cause and the effect, creating a spurious association.", note: "Example: sicker patients get more intensive treatment and also have worse outcomes." },

  // ---- Machine Learning
  { topic: "ml", term: "Overfitting", def: "The model memorizes noise in the training data and performs much worse on unseen data.", note: "Signal: training loss keeps falling while validation loss rises." },
  { topic: "ml", term: "Bias–variance tradeoff", def: "Simple models underfit (high bias); flexible models overfit (high variance). Good generalization balances both.", note: "Total error ≈ bias² + variance + irreducible noise." },
  { topic: "ml", term: "Regularization (L1 / L2)", def: "A penalty on weight size added to the loss. L2 shrinks weights smoothly; L1 pushes some exactly to zero (sparsity).", note: "In PyTorch, L2 is the optimizer's weight_decay." },
  { topic: "ml", term: "Cross-validation", def: "Split data into k folds; train on k−1 and validate on the remaining one, rotating, then average the scores.", note: "Gives a more stable estimate than a single split." },
  { topic: "ml", term: "Gradient descent", def: "Iteratively updates parameters in the direction opposite to the loss gradient: θ ← θ − η∇L(θ).", note: "η is the learning rate." },
  { topic: "ml", term: "Ensemble methods", def: "Combine many models. Bagging (random forest) averages independent trees; boosting (XGBoost) fits trees sequentially on errors.", note: "Strong defaults for tabular data." },

  // ---- PyTorch
  { topic: "torch", term: "torch.Tensor", def: "An n-dimensional array with optional GPU placement and automatic differentiation support.", note: "Key attributes: shape, dtype, device, requires_grad." },
  { topic: "torch", term: "Autograd", def: "PyTorch's automatic differentiation engine. It records operations in a dynamic graph and computes gradients on loss.backward().", note: "Gradients land in each parameter's .grad." },
  { topic: "torch", term: "nn.Module", def: "Base class for layers and models. Define layers in __init__ and the computation in forward().", note: "Call model(x), not model.forward(x), so hooks run." },
  { topic: "torch", term: "Dataset & DataLoader", def: "Dataset defines __len__ and __getitem__; DataLoader adds batching, shuffling, and parallel loading (num_workers).", note: "Shuffle training data, not validation data." },
  { topic: "torch", term: "model.train() vs model.eval()", def: "Toggles layers like Dropout and BatchNorm between training and inference behavior.", note: "Forgetting eval() at inference is a classic bug." },
  { topic: "torch", term: "torch.no_grad()", def: "Context manager that disables gradient tracking, saving memory and compute during evaluation.", note: "torch.inference_mode() is a stricter, faster variant." },

  // ---- Karl Storz Products
  { topic: "ksprod", term: "Hopkins rod-lens system", def: "Endoscope optics that use solid glass rods instead of air gaps to relay the image, giving a brighter, sharper, wider view.", note: "Foundational to modern rigid endoscopy." },
  { topic: "ksprod", term: "Rigid vs. flexible endoscopes", def: "Rigid scopes use rod-lens optics for high image quality in straight access paths; flexible scopes bend to reach tortuous anatomy.", note: "Choice depends on the procedure and access route." },
  { topic: "ksprod", term: "IMAGE1 S camera platform", def: "Modular imaging platform for HD/4K visualization with image-enhancement modes and fluorescence options.", note: "Verify current feature names with official product materials." },
  { topic: "ksprod", term: "Fluorescence / NIR-ICG imaging", def: "Uses near-infrared light and indocyanine green dye to visualize perfusion, bile ducts, or lymphatics during surgery.", note: "Helps surgeons see structures not visible in white light." },
  { topic: "ksprod", term: "OR1 integrated operating room", def: "Connects cameras, devices, displays, and documentation into one controllable OR system.", note: "Sold as a solution: consult, design, install, train, service." },
  { topic: "ksprod", term: "C-MAC video laryngoscope", def: "Airway device that places a camera at the blade tip so the glottic view is shown on a monitor during intubation.", note: "Used by anesthesia, emergency, and critical-care teams." },
  { topic: "ksprod", term: "VITOM exoscope", def: "An external high-definition scope positioned outside the surgical field to visualize open surgery on a monitor.", note: "Alternative or complement to the surgical microscope." },

  // ---- Karl Storz Sales ecosystem
  { topic: "kssales", term: "Capital vs. recurring revenue", def: "Capital = durable equipment bought once (towers, cameras, OR integration). Recurring = instruments, accessories, service contracts.", note: "A capital placement can pull through recurring revenue." },
  { topic: "kssales", term: "Value Analysis Committee (VAC)", def: "Hospital group that reviews new products for clinical benefit, cost, and standardization before purchase approval.", note: "Bring clinical evidence and a cost-impact summary." },
  { topic: "kssales", term: "GPO / IDN contracts", def: "Group Purchasing Organizations and Integrated Delivery Networks pre-negotiate pricing and vendor access for member hospitals.", note: "Contract status often decides who can buy what." },
  { topic: "kssales", term: "Total cost of ownership (TCO)", def: "Purchase price plus service, repair, training, consumables, and downtime over the equipment's life.", note: "The core reply to a pure price objection." },
  { topic: "kssales", term: "Clinical evaluation / demo", def: "Trial placement of equipment so surgeons and staff can validate performance in real cases before purchase.", note: "Define success criteria before the trial begins." },
  { topic: "kssales", term: "Economic buyer vs. clinical champion", def: "The clinical champion (e.g. a surgeon) wants the product; the economic buyer (e.g. CFO / materials management) authorizes spend.", note: "You need both, plus procurement and biomed." },

  // ---- AI terminology
  { topic: "ai", term: "Inference", def: "Running a trained model on new input to produce a prediction or output, as opposed to training it.", note: "Latency and cost are inference concerns." },
  { topic: "ai", term: "Foundation model", def: "A large model pretrained on broad data that can be adapted to many downstream tasks.", note: "GPT-style LLMs and vision-language models are examples." },
  { topic: "ai", term: "Hallucination", def: "A model produces fluent but false or unsupported content.", note: "Mitigate with grounding, retrieval, and verification." },
  { topic: "ai", term: "Embedding", def: "A dense vector representing text, images, or other data so that similar items are close together.", note: "Powers semantic search and clustering." },
  { topic: "ai", term: "Software as a Medical Device (SaMD)", def: "Software intended for a medical purpose that is not part of a hardware device; often regulated by the FDA.", note: "Clinical AI may fall under SaMD rules." },
  { topic: "ai", term: "PHI & de-identification", def: "Protected Health Information is identifiable health data under HIPAA. De-identification removes or masks identifiers.", note: "Never paste PHI into unapproved tools." },
  { topic: "ai", term: "Model drift", def: "Model performance degrades because input data or the real-world relationship changes over time.", note: "Monitor in production and retrain when needed." },

  // ---- LLM terminology
  { topic: "llm", term: "Token", def: "The unit of text an LLM reads and writes: a word, subword, or character chunk. Pricing and limits are counted in tokens.", note: "Roughly ¾ of an English word on average." },
  { topic: "llm", term: "Context window", def: "The maximum number of tokens (prompt + output) the model can consider at once.", note: "Beyond it, content must be summarized or retrieved." },
  { topic: "llm", term: "Temperature", def: "Controls randomness when sampling the next token. Low = focused and repeatable; high = diverse and creative.", note: "Use low values for extraction and code." },
  { topic: "llm", term: "RAG (retrieval-augmented generation)", def: "Retrieve relevant documents at query time and include them in the prompt so answers are grounded in your data.", note: "Cheaper and fresher than fine-tuning for knowledge." },
  { topic: "llm", term: "Tool use / function calling", def: "The model emits a structured request to call an external function (search, database, calculator); the app runs it and returns the result.", note: "Foundation of agents." },
  { topic: "llm", term: "System prompt", def: "Top-level instructions that set role, rules, and style for a conversation, ahead of user messages.", note: "Treat as policy, not as a security boundary." },
  { topic: "llm", term: "Prompt caching", def: "Reuses the already-processed prefix of a repeated prompt to cut latency and cost.", note: "Keep stable content at the start of the prompt." },

  // ---- Harness
  { topic: "harness", term: "Harness pipeline", def: "In Harness CD/CI, a pipeline is an ordered set of stages (build, test, deploy) that automates delivery.", note: "Defined in the UI or as YAML." },
  { topic: "harness", term: "Harness Delegate", def: "A lightweight worker you run in your infrastructure that executes tasks and talks to your tools on the platform's behalf.", note: "Keeps credentials and network access inside your environment." },
  { topic: "harness", term: "Connector", def: "A saved, reusable integration to an external system such as Git, a cloud, a registry, or a secrets manager.", note: "Pipelines reference connectors instead of raw credentials." },
  { topic: "harness", term: "Canary vs. blue-green deployment", def: "Canary shifts a small share of traffic to the new version first. Blue-green stands up a full parallel environment and switches over.", note: "Both enable fast rollback." },
  { topic: "harness", term: "Feature flag", def: "A runtime switch that turns functionality on or off for chosen users without redeploying.", note: "Decouples deploy from release." },
  { topic: "harness", term: "Agent harness", def: "The scaffolding around an LLM agent: its tool loop, context management, permissions, hooks, and memory.", note: "Model + harness = agent behavior." },
];

// Active retrieval: question first, answer revealed after a delay.
// a: explanation text; code: optional formula or code block (shown monospaced).
window.RETRIEVAL = [
  // ---- Data Science
  { topic: "ds", q: "How does min-max normalization work, and when does it go wrong?",
    code: "x' = (x − x_min) / (x_max − x_min)",
    a: "Each value is mapped linearly into [0, 1]: the minimum becomes 0 and the maximum becomes 1. It goes wrong with outliers (they compress the rest of the data) and with new data outside the training min/max, so fit min and max on the training set only." },
  { topic: "ds", q: "Why can 99% accuracy be a bad result on a rare-disease classifier?",
    a: "If only 1% of patients are positive, a model that always predicts \"negative\" is 99% accurate yet finds no one. Check recall, precision, and PR-AUC, and look at the confusion matrix instead of accuracy alone." },
  { topic: "ds", q: "You standardize features before splitting into train/test. What is wrong?",
    a: "That is data leakage. The mean and standard deviation were computed using test rows. Split first, fit the scaler on training data, then apply (transform) it to validation and test data. A scikit-learn Pipeline enforces this automatically." },

  // ---- Machine Learning
  { topic: "ml", q: "Training loss keeps decreasing but validation loss started rising. What is happening and what can you do?",
    a: "Overfitting. Options: early stopping, more data or augmentation, stronger regularization (weight decay, dropout), a smaller model, or fewer features." },
  { topic: "ml", q: "Write the gradient descent update rule and explain the learning rate.",
    code: "θ ← θ − η · ∇θ L(θ)",
    a: "Move each parameter a small step against the gradient of the loss. η (learning rate) sets step size: too large diverges or oscillates, too small trains slowly or gets stuck. Schedulers and warmup help." },
  { topic: "ml", q: "How do L1 and L2 regularization differ in effect?",
    code: "L1: loss + λ Σ|w|      L2: loss + λ Σ w²",
    a: "L2 shrinks all weights smoothly toward zero. L1 has a constant-magnitude gradient that drives many weights exactly to zero, giving sparse models and implicit feature selection." },

  // ---- PyTorch
  { topic: "torch", q: "Write the five lines of a standard PyTorch training step.",
    code: "optimizer.zero_grad()\npred = model(x)\nloss = criterion(pred, y)\nloss.backward()\noptimizer.step()",
    a: "Clear old gradients (they accumulate by default), forward pass, compute loss, backpropagate to fill .grad, then update the weights." },
  { topic: "torch", q: "What is the difference between model.eval() and torch.no_grad()? Do you need both?",
    a: "eval() changes layer behavior (Dropout off, BatchNorm uses running stats). no_grad() stops autograd from tracking operations to save memory. For inference you normally want both." },
  { topic: "torch", q: "Define a minimal two-layer network as an nn.Module.",
    code: "class Net(nn.Module):\n    def __init__(self, d_in, d_hid, d_out):\n        super().__init__()\n        self.fc1 = nn.Linear(d_in, d_hid)\n        self.fc2 = nn.Linear(d_hid, d_out)\n    def forward(self, x):\n        return self.fc2(torch.relu(self.fc1(x)))",
    a: "Layers are registered in __init__ so their parameters are tracked; forward() defines the computation. The output here is raw logits, which CrossEntropyLoss expects (no softmax needed)." },

  // ---- Karl Storz Products
  { topic: "ksprod", q: "Why does a Hopkins rod-lens endoscope give a brighter image than a traditional lens-relay scope?",
    a: "Traditional designs use thin glass lenses separated by air. Hopkins reverses this: long glass rods fill most of the space and short air gaps act as lenses. More glass means less light lost and a wider field of view, so the image is brighter and sharper in the same diameter." },
  { topic: "ksprod", q: "A surgeon asks what fluorescence imaging adds over white light. How do you explain it?",
    a: "A fluorescent dye such as ICG, excited by near-infrared light, glows and is shown as an overlay. It lets the surgeon assess tissue perfusion, bile duct anatomy, or lymph nodes in real time. Confirm the indications and supported configurations in current official materials." },
  { topic: "ksprod", q: "Which elements make up an integrated OR solution, and why does it matter to a hospital?",
    a: "Typically: cameras and light sources, displays, device control, video routing, documentation or streaming, and a central touch interface. Value: faster room turnover, less cable clutter, better ergonomics, recording for education and records, and centralized support." },

  // ---- Karl Storz Sales
  { topic: "kssales", q: "A buyer says your camera system is more expensive than the competitor's. How do you respond?",
    a: "Reframe to total cost of ownership: service coverage, uptime and loaner availability, training, upgrade path, and compatibility with existing scopes. Ask what outcomes and downtime cost them. Quantify, do not discount first." },
  { topic: "kssales", q: "Who should you map in a hospital purchase of a new OR video platform?",
    a: "Clinical champion (surgeon), OR nursing/director, biomed/clinical engineering, IT and security, materials management/procurement, finance (economic buyer), and the Value Analysis Committee. Also check whether a GPO or IDN contract applies." },
  { topic: "kssales", q: "What makes a clinical evaluation successful rather than just a free trial?",
    a: "Agree up front on goals, cases, metrics (image quality, setup time, workflow), the decision date, and who decides. Train users, collect feedback, and review results with the buying group. Without exit criteria, trials stall." },

  // ---- AI terminology
  { topic: "ai", q: "What is the difference between training and inference, and which is usually costlier?",
    a: "Training adjusts weights using data and gradients, which is compute-heavy but one-time (or periodic). Inference applies fixed weights to new input. For widely used models the cumulative inference cost, driven by latency and scale, often exceeds training." },
  { topic: "ai", q: "How do embeddings enable semantic search?",
    code: "similarity = cos(e_query, e_doc) = (a · b) / (‖a‖ ‖b‖)",
    a: "Text is mapped to vectors where similar meaning means a similar direction. Embed documents once, embed the query, and return the nearest vectors by cosine similarity, finding matches by meaning rather than exact keywords." },
  { topic: "ai", q: "Why is pasting patient notes into a public chatbot a problem?",
    a: "Notes can contain PHI. Sending it to a service with no business associate agreement or approved data handling may violate HIPAA and policy. Use approved tools or de-identified data." },

  // ---- LLM terminology
  { topic: "llm", q: "How does temperature change next-token sampling?",
    code: "p_i = softmax(z_i / T)",
    a: "Logits are divided by T before softmax. T < 1 sharpens the distribution (more deterministic); T > 1 flattens it (more varied). T → 0 approaches greedy decoding." },
  { topic: "llm", q: "RAG or fine-tuning: how do you choose for a company knowledge assistant?",
    a: "Use RAG when knowledge changes, must be cited, or is access-controlled: update the index, not the model. Fine-tune to change behavior, tone, or format, or to teach a narrow skill. Many systems combine both." },
  { topic: "llm", q: "Walk through one tool-calling loop.",
    a: "1) The app sends the prompt plus tool definitions. 2) The model returns a structured call (name + arguments). 3) Your code executes it. 4) You send the result back as a message. 5) The model uses it to answer or to call another tool, repeating until done." },

  // ---- Harness
  { topic: "harness", q: "What is the role of a Delegate, and why not run tasks from the SaaS control plane directly?",
    a: "The Delegate runs inside your network, pulls work from the platform, and executes it using your connectors. Secrets and cluster access stay in your environment and need no inbound firewall holes." },
  { topic: "harness", q: "Compare canary and blue-green deployments, including rollback.",
    a: "Canary routes a small percentage of traffic to the new version, verifies metrics, then expands; rollback means shifting the traffic back. Blue-green runs two full environments and flips the router; rollback is flipping back, at the cost of double infrastructure." },
  { topic: "harness", q: "In an AI agent harness, what does the harness do that the model alone cannot?",
    a: "It runs the loop: builds context, exposes tools, executes tool calls, enforces permissions, runs hooks, manages memory and context limits, and feeds results back. The model only predicts the next step; the harness makes it act safely." },
];

// Quiz cards: multiple choice. correctIndex is 0-based.
window.QUIZ = [
  { topic: "ds", q: "A screening test for a rare, serious disease must avoid missing cases. Which metric matters most?", choices: ["Accuracy", "Recall (sensitivity)", "Specificity", "Precision"], correctIndex: 1, explanation: "Recall = TP / (TP + FN). High recall means few missed positives, which is the priority for screening. Accuracy is misleading when the disease is rare." },
  { topic: "ds", q: "You scale features on the full dataset and then split into train and test. What problem does this introduce?", choices: ["Underfitting", "Data leakage", "Class imbalance", "Multicollinearity"], correctIndex: 1, explanation: "The scaler's mean and standard deviation used information from test rows. Split first, fit on train only." },
  { topic: "ml", q: "Training loss keeps falling while validation loss rises. What is most likely happening?", choices: ["Underfitting", "Overfitting", "Vanishing gradients", "Data drift"], correctIndex: 1, explanation: "The model is memorizing training noise. Try early stopping, regularization, more data, or a simpler model." },
  { topic: "ml", q: "Which regularization penalty tends to drive some weights exactly to zero?", choices: ["L1", "L2", "Dropout", "Batch normalization"], correctIndex: 0, explanation: "The L1 penalty λΣ|w| has a constant-magnitude gradient, producing sparse weights." },
  { topic: "torch", q: "Which call clears accumulated gradients before the next backward pass?", choices: ["loss.backward()", "optimizer.step()", "optimizer.zero_grad()", "model.eval()"], correctIndex: 2, explanation: "PyTorch accumulates gradients into .grad by default, so you reset them each iteration." },
  { topic: "torch", q: "Which context manager disables gradient tracking during evaluation?", choices: ["torch.enable_grad()", "torch.no_grad()", "model.train()", "torch.autograd.backward()"], correctIndex: 1, explanation: "torch.no_grad() saves memory and compute. Pair it with model.eval() for inference." },
  { topic: "ksprod", q: "What is the key advantage of Hopkins rod-lens optics?", choices: ["Smaller scope handle", "Brighter, sharper image from glass rods replacing air gaps", "Wireless video", "Lower sterilization cost"], correctIndex: 1, explanation: "Solid glass rods relay the image with less light loss and a wider field of view than air-spaced lens relays." },
  { topic: "ksprod", q: "A C-MAC video laryngoscope is primarily used for:", choices: ["Colonoscopy", "Airway management and intubation", "Knee arthroscopy", "Hysteroscopy"], correctIndex: 1, explanation: "The camera at the blade tip shows the glottic view on a monitor during intubation." },
  { topic: "kssales", q: "A buyer objects to price on a capital system. Which reframing is strongest?", choices: ["Offer an immediate discount", "Compare total cost of ownership and uptime", "Wait for them to decide", "Emphasize brand history only"], correctIndex: 1, explanation: "TCO covers service, training, downtime, consumables, and upgrades. Quantify value before discounting." },
  { topic: "kssales", q: "Which group usually reviews new products for clinical benefit and cost before approval?", choices: ["Value Analysis Committee", "Marketing department", "Sterile processing", "Patient advisory board"], correctIndex: 0, explanation: "The VAC evaluates evidence, cost impact, and standardization." },
  { topic: "ai", q: "Which regulation governs protected health information in the US?", choices: ["GDPR", "HIPAA", "SOX", "FERPA"], correctIndex: 1, explanation: "HIPAA defines PHI and the safeguards for handling it. Do not paste PHI into unapproved tools." },
  { topic: "ai", q: "Embeddings are best described as:", choices: ["Compressed model weights", "Dense vectors where similar items are close together", "Encrypted tokens", "Training labels"], correctIndex: 1, explanation: "They enable semantic search and clustering through vector similarity." },
  { topic: "llm", q: "What does lowering an LLM's temperature do?", choices: ["Makes output more random", "Makes output more deterministic", "Increases context window", "Reduces model size"], correctIndex: 1, explanation: "Logits are divided by T before softmax, so lower T sharpens the distribution." },
  { topic: "llm", q: "What is the main purpose of RAG?", choices: ["Speed up training", "Ground answers in retrieved documents", "Compress prompts", "Replace tokenization"], correctIndex: 1, explanation: "Relevant documents are retrieved at query time and included in the prompt." },
  { topic: "harness", q: "Where does a Harness Delegate run?", choices: ["Only inside Harness SaaS", "In your own infrastructure", "In the end user's browser", "On the Git provider"], correctIndex: 1, explanation: "It runs in your network, so credentials and access stay in your environment." },
  { topic: "harness", q: "In a canary deployment, what happens first?", choices: ["All traffic moves at once", "A small share of traffic goes to the new version", "A full parallel environment replaces the old one", "The old version is deleted"], correctIndex: 1, explanation: "Canary verifies the new version on limited traffic before expanding. Blue-green swaps whole environments instead." },
];
