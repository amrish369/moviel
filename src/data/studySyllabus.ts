export interface Subject {
  id: string;
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
      { id: "c-programming", label: "C Programming", query: "BCA 2nd semester C Programming" },
      { id: "data-structures", label: "Data Structures", query: "BCA 2nd semester Data Structures" },
      { id: "dbms", label: "DBMS", query: "BCA 2nd semester DBMS database management system" },
      { id: "digital-electronics", label: "Digital Electronics", query: "BCA 2nd semester Digital Electronics" },
      { id: "maths-2", label: "Mathematics-II", query: "BCA 2nd semester Mathematics 2" },
      { id: "os", label: "Operating System", query: "BCA 2nd semester Operating System" },
      { id: "communication", label: "Communication Skills", query: "BCA 2nd semester Communication Skills English" },
    ],
  },
  { id: "3", label: "Semester 3", available: false, subjects: [] },
  { id: "4", label: "Semester 4", available: false, subjects: [] },
  { id: "5", label: "Semester 5", available: false, subjects: [] },
  { id: "6", label: "Semester 6", available: false, subjects: [] },
];

export const getSemester = (id: string) => SEMESTERS.find((s) => s.id === id) ?? SEMESTERS[1];
