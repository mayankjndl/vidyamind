// ===== Official 2026 Exam Syllabi =====
// Hardcoded from official sources — these become exact KG nodes

import { KnowledgeGraph } from "@/lib/knowledge-graph/types";

export interface ExamConcept {
    subject: string;
    topics: string[];
}

export interface ExamInfo {
    id: string;
    name: string;
    shortName: string;
    description: string;
    examDate: string;
    icon: string;
    subjects: string[];
    concepts: ExamConcept[];
    syllabus: string;
}

// ===== NEET UG 2026 =====
const NEET_CONCEPTS: ExamConcept[] = [
    {
        subject: "Physics",
        topics: [
            "Physics and Measurement (Units, Dimensions, Errors, Least Count)",
            "Kinematics (Motion in a Straight Line, Motion in a Plane, Vectors)",
            "Laws of Motion (Newton's Laws, Friction, Circular Motion)",
            "Work, Energy and Power",
            "Rotational Motion (System of Particles, Moment of Inertia)",
            "Gravitation (Kepler's Laws, Acceleration due to gravity, Satellites)",
            "Properties of Bulk Matter (Elasticity, Fluids, Surface Tension, Viscosity, Thermal Properties)",
            "Thermodynamics (Laws, Heat Engines, Refrigerators)",
            "Kinetic Theory of Gases",
            "Oscillations and Waves (SHM, Resonance, Doppler Effect)",
            "Electrostatics (Coulomb's Law, Gauss's Law, Potential, Capacitance)",
            "Current Electricity (Ohm's Law, Kirchhoff's Laws, Wheatstone Bridge, Potentiometer)",
            "Magnetic Effects of Current and Magnetism (Biot-Savart, Ampere's Law, Cyclotron, Earth's Magnetism)",
            "Electromagnetic Induction and Alternating Currents (Faraday's, Lenz's Law, LCR Circuits)",
            "Electromagnetic Waves",
            "Optics (Ray Optics, Wave Optics, Huygens Principle, Interference, Diffraction)",
            "Dual Nature of Matter and Radiation (Photoelectric effect, De Broglie)",
            "Atoms and Nuclei (Radioactivity, Half-life)",
            "Electronic Devices (Semiconductors, P-N Junction, Logic Gates)",
            "Experimental Skills (Vernier Calliper, Screw Gauge, Simple Pendulum, Metre Bridge, Galvanometer, Focal Length, Refractive Index, P-N Junction Diode, Zener Diode)",
        ],
    },
    {
        subject: "Chemistry",
        topics: [
            "Some Basic Concepts of Chemistry (Mole Concept, Stoichiometry)",
            "Atomic Structure (Bohr's model, Quantum numbers, Orbitals)",
            "Classification of Elements and Periodicity (Electronic configurations)",
            "Chemical Bonding and Molecular Structure (VSEPR, Hybridization, MOT)",
            "Chemical Thermodynamics (Laws, Enthalpy, Entropy, Gibbs Energy)",
            "Equilibrium (Chemical & Ionic, pH, Solubility product)",
            "Redox Reactions (Oxidation number, Balancing)",
            "Solutions (Raoult's Law, Colligative Properties)",
            "Electrochemistry (Nernst equation, Conductance, Electrolysis)",
            "Chemical Kinetics (Rate laws, Collision theory)",
            "p-Block Elements (Groups 13 to 18)",
            "d- and f-Block Elements (Lanthanoids, Actinoids)",
            "Coordination Compounds (Werner's theory, CFT, Isomerism)",
            "Purification and Characterization of Organic Compounds",
            "Some Basic Principles of Organic Chemistry (GOC, Isomerism, IUPAC)",
            "Hydrocarbons (Alkanes, Alkenes, Alkynes, Aromaticity)",
            "Organic Compounds Containing Halogens (Haloalkanes, Haloarenes)",
            "Organic Compounds Containing Oxygen (Alcohols, Phenols, Ethers, Aldehydes, Ketones, Carboxylic Acids)",
            "Organic Compounds Containing Nitrogen (Amines, Diazonium salts)",
            "Biomolecules (Carbohydrates, Proteins, Hormones, Nucleic Acids)",
            "Principles Related to Practical Chemistry (Detection of elements, Functional groups, Titrimetric analysis, Qualitative analysis, Sols)",
        ],
    },
    {
        subject: "Biology",
        topics: [
            "Diversity in Living World (Kingdoms Monera, Protista, Fungi, Plantae, Animalia)",
            "Structural Organisation in Animals and Plants (Morphology & Anatomy of Flowering Plants, Frog, Cockroach)",
            "Cell Structure and Function (Cell organelles, Cell cycle, Biomolecules)",
            "Plant Physiology (Photosynthesis, Respiration, Plant growth)",
            "Human Physiology (Breathing, Body fluids, Excretion, Locomotion, Neural & Chemical Coordination)",
            "Reproduction (Sexual Reproduction in Flowering Plants, Human Reproduction, Reproductive Health)",
            "Genetics and Evolution (Mendelian Inheritance, Molecular Basis, Evolution)",
            "Biology and Human Welfare (Health & Disease, Microbes)",
            "Biotechnology and Its Applications (Genetic engineering, Medicine, Agriculture)",
            "Ecology and Environment (Organisms, Ecosystems, Biodiversity)",
        ],
    },
];

// ===== JEE Main 2026 =====
const JEE_MAIN_CONCEPTS: ExamConcept[] = [
    {
        subject: "Physics",
        topics: [
            // All NEET Physics topics
            "Physics and Measurement (Units, Dimensions, Errors, Least Count)",
            "Kinematics (Motion in a Straight Line, Motion in a Plane, Vectors)",
            "Laws of Motion (Newton's Laws, Friction, Circular Motion)",
            "Work, Energy and Power",
            "Rotational Motion (System of Particles, Moment of Inertia)",
            "Gravitation (Kepler's Laws, Acceleration due to gravity, Satellites)",
            "Properties of Bulk Matter (Elasticity, Fluids, Surface Tension, Viscosity, Thermal Properties)",
            "Thermodynamics (Laws, Heat Engines, Refrigerators)",
            "Kinetic Theory of Gases",
            "Oscillations and Waves (SHM, Resonance, Doppler Effect)",
            "Electrostatics (Coulomb's Law, Gauss's Law, Potential, Capacitance)",
            "Current Electricity (Ohm's Law, Kirchhoff's Laws, Wheatstone Bridge, Potentiometer)",
            "Magnetic Effects of Current and Magnetism (Biot-Savart, Ampere's Law, Cyclotron, Earth's Magnetism)",
            "Electromagnetic Induction and Alternating Currents (Faraday's, Lenz's Law, LCR Circuits)",
            "Electromagnetic Waves",
            "Optics (Ray Optics, Wave Optics, Huygens Principle, Interference, Diffraction)",
            "Dual Nature of Matter and Radiation (Photoelectric effect, De Broglie)",
            "Atoms and Nuclei (Radioactivity, Half-life)",
            "Electronic Devices (Semiconductors, P-N Junction, Logic Gates)",
            // JEE Mains additional
            "Advanced Mechanics and Electromagnetism (Rigorous treatment)",
            "Experimental Skills (Speed of sound, Specific heat, Resistivity via Metre Bridge, Ohm's Law verification, Figure of Merit of Galvanometer)",
        ],
    },
    {
        subject: "Chemistry",
        topics: [
            // All NEET Chemistry topics
            "Some Basic Concepts of Chemistry (Mole Concept, Stoichiometry)",
            "Atomic Structure (Bohr's model, Quantum numbers, Orbitals)",
            "Classification of Elements and Periodicity (Electronic configurations)",
            "Chemical Bonding and Molecular Structure (VSEPR, Hybridization, MOT)",
            "Chemical Thermodynamics (Laws, Enthalpy, Entropy, Gibbs Energy)",
            "Equilibrium (Chemical & Ionic, pH, Solubility product)",
            "Redox Reactions (Oxidation number, Balancing)",
            "Solutions (Raoult's Law, Colligative Properties)",
            "Electrochemistry (Nernst equation, Conductance, Electrolysis)",
            "Chemical Kinetics (Rate laws, Collision theory)",
            "p-Block Elements (Groups 13 to 18)",
            "d- and f-Block Elements (Lanthanoids, Actinoids)",
            "Coordination Compounds (Werner's theory, CFT, Isomerism)",
            "Purification and Characterization of Organic Compounds",
            "Some Basic Principles of Organic Chemistry (GOC, Isomerism, IUPAC)",
            "Hydrocarbons (Alkanes, Alkenes, Alkynes, Aromaticity)",
            "Organic Compounds Containing Halogens (Haloalkanes, Haloarenes)",
            "Organic Compounds Containing Oxygen (Alcohols, Phenols, Ethers, Aldehydes, Ketones, Carboxylic Acids)",
            "Organic Compounds Containing Nitrogen (Amines, Diazonium salts)",
            "Biomolecules (Carbohydrates, Proteins, Hormones, Nucleic Acids)",
            "Principles Related to Practical Chemistry (Detection of elements, Functional groups, Titrimetric analysis, Qualitative analysis, Sols)",
        ],
    },
    {
        subject: "Mathematics",
        topics: [
            "Sets, Relations and Functions",
            "Complex Numbers and Quadratic Equations",
            "Matrices and Determinants",
            "Permutations and Combinations",
            "Binomial Theorem and its Applications",
            "Sequence and Series",
            "Limit, Continuity and Differentiability (Mean Value Theorems)",
            "Integral Calculus (Indefinite/Definite, Area under curves)",
            "Differential Equations (Order/Degree, Linear equations)",
            "Coordinate Geometry (Straight Lines, Circles, Conics — Parabola, Ellipse, Hyperbola)",
            "Three Dimensional Geometry (Lines, Planes)",
            "Vector Algebra",
            "Statistics and Probability",
            "Trigonometry (Functions, Identities, Equations)",
        ],
    },
];

// ===== JEE Advanced 2026 =====
const JEE_ADVANCED_CONCEPTS: ExamConcept[] = [
    {
        subject: "Physics",
        topics: [
            "General (Units, Dimensions, Error, Experimental Skills)",
            "Mechanics (Rolling Motion, Fluid Mechanics, Elasticity, Surface Tension)",
            "Thermal Physics (Laws, Calorimetry, Heat Transfer, KTG)",
            "Electricity and Magnetism (Capacitance, R-C circuits, L-R, L-C-R, Magnetic properties)",
            "Optics (Wave Optics — Polarization, Brewster's Law included)",
            "Modern Physics (X-rays, Radioactivity, Photoelectric effect)",
        ],
    },
    {
        subject: "Physical Chemistry",
        topics: [
            "Solid State",
            "Surface Chemistry",
            "Solutions",
            "Atomic Structure",
            "Thermodynamics",
            "Equilibrium",
            "Chemical Kinetics",
            "Electrochemistry",
        ],
    },
    {
        subject: "Inorganic Chemistry",
        topics: [
            "Ores and Metallurgy",
            "s-Block and p-Block Elements",
            "d-Block and f-Block Elements",
            "Coordination Compounds",
            "Qualitative Analysis",
        ],
    },
    {
        subject: "Organic Chemistry",
        topics: [
            "Stereochemistry",
            "Reaction Mechanisms (Alkanes to Amines)",
            "Polymers",
            "Carbohydrates and Amino Acids",
        ],
    },
    {
        subject: "Mathematics",
        topics: [
            "Algebra (Logarithms, Complex Numbers, Matrices, Determinants, Probability, Sequences)",
            "Trigonometry (Inverse functions)",
            "Analytical Geometry (Standard forms of 2D conics, 3D Geometry of lines and planes)",
            "Differential Calculus (Implicit/Explicit differentiation, Maxima/Minima)",
            "Integral Calculus (Definite integrals, Areas, Differential equations)",
            "Vectors",
        ],
    },
];

// ===== CLAT 2026 =====
const CLAT_CONCEPTS: ExamConcept[] = [
    {
        subject: "English Language",
        topics: [
            "Reading Comprehension",
            "Meaning of Words and Phrases",
            "Inferences",
            "Main Point Identification",
            "Comparisons",
        ],
    },
    {
        subject: "Current Affairs and General Knowledge",
        topics: [
            "National and International News (Jan–Dec 2025)",
            "Art and Culture",
            "International Organisations",
            "Awards and Sports",
            "Historic Milestones",
        ],
    },
    {
        subject: "Legal Reasoning",
        topics: [
            "Tort Law",
            "Law of Contracts",
            "Criminal Law",
            "Constitutional Law (Preamble, Fundamental Rights, DPSP)",
            "International Law Basics",
        ],
    },
    {
        subject: "Logical Reasoning",
        topics: [
            "Arguments, Premises and Conclusions",
            "Strengthening and Weakening Arguments",
            "Syllogisms",
            "Analogies",
        ],
    },
    {
        subject: "Quantitative Techniques",
        topics: [
            "Data Interpretation (Tables, Pie charts, Bar graphs)",
            "Ratio and Proportion",
            "Average and Percentage",
            "Mensuration (10th Standard)",
        ],
    },
];

// ===== Exam Registry =====
export const EXAMS: ExamInfo[] = [
    {
        id: "neet_2026",
        name: "NEET UG 2026",
        shortName: "NEET",
        description: "National Eligibility cum Entrance Test for medical admissions",
        examDate: "2026-05-03",
        icon: "🩺",
        subjects: ["Physics", "Chemistry", "Biology"],
        concepts: NEET_CONCEPTS,
        syllabus: `NEET UG 2026 — Physics (20), Chemistry (21), Biology (10). Includes experimental skills and practical chemistry.`,
    },
    {
        id: "jee_main_2026",
        name: "JEE Main 2026",
        shortName: "JEE Main",
        description: "Joint Entrance Exam for engineering admissions across India",
        examDate: "2026-04-10",
        icon: "⚙️",
        subjects: ["Physics", "Chemistry", "Mathematics"],
        concepts: JEE_MAIN_CONCEPTS,
        syllabus: `JEE Main 2026 — Physics (21, superset of NEET), Chemistry (21, same as NEET), Mathematics (14). States of Matter, Surface Chemistry, s-block removed for 2026.`,
    },
    {
        id: "jee_advanced_2026",
        name: "JEE Advanced 2026",
        shortName: "JEE Adv",
        description: "Joint Entrance Exam for IIT admissions",
        examDate: "2026-06-14",
        icon: "🏛️",
        subjects: ["Physics", "Chemistry", "Mathematics"],
        concepts: JEE_ADVANCED_CONCEPTS,
        syllabus: `JEE Advanced 2026 — Physics (6 broad), Physical Chem (8), Inorganic (5), Organic (4), Mathematics (6). Includes topics deleted from Mains.`,
    },
    {
        id: "clat_2026",
        name: "CLAT 2026",
        shortName: "CLAT",
        description: "Common Law Admission Test for National Law Universities",
        examDate: "2026-12-06",
        icon: "⚖️",
        subjects: ["English", "GK", "Legal Reasoning", "Logical Reasoning", "Quantitative"],
        concepts: CLAT_CONCEPTS,
        syllabus: `CLAT 2026 — English (5), Current Affairs/GK (5), Legal Reasoning (5), Logical Reasoning (4), Quantitative (4).`,
    },
];

export function getExamById(id: string): ExamInfo | undefined {
    return EXAMS.find((e) => e.id === id);
}

export function getExamSyllabus(examId: string): string {
    const exam = getExamById(examId);
    return exam?.syllabus || "";
}

// ===== Build KG directly from hardcoded concepts (no AI needed) =====
export function buildKGFromExam(exam: ExamInfo): KnowledgeGraph {
    let topicIndex = 0;
    const concepts = exam.concepts.flatMap((section) =>
        section.topics.map((topic) => {
            topicIndex++;
            const id = topic
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_|_$/g, "");
            return {
                id,
                name: topic,
                description: `${topic} — ${section.subject} (${exam.shortName})`,
                difficulty: Math.min(10, Math.ceil(topicIndex / 3)),
                bloomLevel: "understand" as const,
                prerequisites: [] as string[],
            };
        })
    );

    // Build prerequisite chains within each subject
    const subjectGroups: Record<string, number[]> = {};
    let idx = 0;
    for (const section of exam.concepts) {
        for (let t = 0; t < section.topics.length; t++) {
            const subj = section.subject;
            if (!subjectGroups[subj]) subjectGroups[subj] = [];
            subjectGroups[subj].push(idx);
            idx++;
        }
    }
    for (const indices of Object.values(subjectGroups)) {
        for (let i = 1; i < indices.length; i++) {
            concepts[indices[i]].prerequisites = [concepts[indices[i - 1]].id];
        }
    }

    return {
        id: `kg_${exam.id}`,
        subject: exam.name,
        concepts,
        createdAt: new Date().toISOString(),
    };
}
