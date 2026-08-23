export interface Subject {
  id: string;
  code: string;
  label: string;
  query: string;
}

export interface Semester {
  id: string;
  label: string;
  available: boolean;
  subjects: Subject[];
}

export const SEMESTERS: Semester[] = [
  { id: "1", label: "Semester 1", available: false, subjects: [] },
  {
    id: "2",
    label: "Semester 2",
    available: true,
    subjects: [
      { id: "feg-02", code: "FEG-02", label: "Foundation Course in English-2", query: "FEG 02 IGNOU Foundation Course in English 2" },
      { id: "mcs-201", code: "MCS-201", label: "Programming in C and Python", query: "MCS 201 IGNOU Programming in C and Python" },
      { id: "mcs-202", code: "MCS-202", label: "Computer Organisation", query: "MCS 202 IGNOU Computer Organisation" },
      { id: "mcs-203", code: "MCS-203", label: "Operating Systems", query: "MCS 203 IGNOU Operating Systems" },
      { id: "mcsl-204", code: "MCSL-204", label: "Windows and Linux Lab", query: "MCSL 204 IGNOU Windows and Linux Lab" },
      { id: "mcsl-205", code: "MCSL-205", label: "C and Python Lab", query: "MCSL 205 IGNOU C and Python Lab" },
    ],
  },
  { id: "3", label: "Semester 3", available: false, subjects: [] },
  { id: "4", label: "Semester 4", available: false, subjects: [] },
  { id: "5", label: "Semester 5", available: false, subjects: [] },
  { id: "6", label: "Semester 6", available: false, subjects: [] },
];

export const getSemester = (id: string) => SEMESTERS.find((s) => s.id === id) ?? SEMESTERS[1];
