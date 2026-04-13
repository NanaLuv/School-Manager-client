import {
  useState,
  useEffect,
  useContext,
  createContext,
} from "react";
import api from "../components/axiosconfig/axiosConfig";

// Create context for academic data
const AcademicContext = createContext();

export const useAcademicContext = () => useContext(AcademicContext);

// Custom hook that pages can use
export const useAcademicData = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data on mount and auto-select
  useEffect(() => {
    fetchAllDataAndAutoSelect();
  }, []);

  // Fetch terms when academic year changes
  useEffect(() => {
    if (selectedAcademicYear) {
      fetchTermsForYear(selectedAcademicYear);
    } else {
      setTerms([]);
      setSelectedTerm(null);
    }
  }, [selectedAcademicYear]);

  const fetchAllDataAndAutoSelect = async () => {
    try {
      setLoading(true);

      // Fetch academic years first
      const yearsResponse = await api.get("/getacademicyears");
      const yearsData = yearsResponse.data;
      const yearsArray = Array.isArray(yearsData)
        ? yearsData
        : yearsData.years || [];
      setAcademicYears(yearsArray);

      // Auto-select current year or first year
      let selectedYearId = null;
      const currentYear = yearsArray.find((year) => year.is_current === true);
      if (currentYear) {
        selectedYearId = currentYear.id;
      } else if (yearsArray.length > 0) {
        selectedYearId = yearsArray[0].id;
      }

      setSelectedAcademicYear(selectedYearId);

      // If we have a year selected, fetch and auto-select its terms
      if (selectedYearId) {
        const termsResponse = await api.get(
          `/terms/by-academic-year?academic_year_id=${selectedYearId}`,
        );
        const termsData = termsResponse.data;
        setTerms(termsData);

        // Auto-select current term or first term
        let selectedTermId = null;
        const today = new Date();
        const currentTerm = termsData.find((term) => {
          try {
            const startDate = new Date(term.start_date);
            const endDate = new Date(term.end_date);
            return startDate <= today && endDate >= today;
          } catch (error) {
            return false;
          }
        });

        if (currentTerm) {
          selectedTermId = currentTerm.id;
        } else if (termsData.length > 0) {
          selectedTermId = termsData[0].id;
        }

        setSelectedTerm(selectedTermId);
      }
    } catch (err) {
      console.error("Error fetching academic data:", err);
      setError("Failed to load academic data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTermsForYear = async (yearId) => {
    try {
      const response = await api.get(
        `/terms/by-academic-year?academic_year_id=${yearId}`,
      );
      setTerms(response.data);

      // Auto-select current term or first term
      const today = new Date();
      const currentTerm = response.data.find((term) => {
        try {
          const startDate = new Date(term.start_date);
          const endDate = new Date(term.end_date);
          return startDate <= today && endDate >= today;
        } catch (error) {
          return false;
        }
      });

      if (currentTerm) {
        setSelectedTerm(currentTerm.id);
      } else if (response.data.length > 0) {
        setSelectedTerm(response.data[0].id);
      } else {
        setSelectedTerm(null);
      }
    } catch (err) {
      console.error("Error fetching terms:", err);
      setError("Failed to load terms");
    }
  };

  // Function to manually set academic year
  const handleAcademicYearChange = (yearId) => {
    setSelectedAcademicYear(yearId);
  };

  // Function to manually set term
  const handleTermChange = (termId) => {
    setSelectedTerm(termId);
  };

  // Function to refresh data
  const refreshData = () => {
    setLoading(true);
    fetchAllDataAndAutoSelect();
  };

  return {
    // Data
    academicYears,
    terms,
    selectedAcademicYear,
    selectedTerm,

    // Selection methods
    handleAcademicYearChange,
    handleTermChange,

    // Utility methods
    refreshData,
    getSelectedAcademicYear: () =>
      academicYears.find((y) => y.id === selectedAcademicYear),
    getSelectedTerm: () => terms.find((t) => t.id === selectedTerm),

    // Status
    loading,
    error,
    hasData: academicYears.length > 0,
    hasTerms: terms.length > 0,
  };
};

// Provider component for app-level usage
export const AcademicProvider = ({ children }) => {
  const academicData = useAcademicData();

  return (
    <AcademicContext.Provider value={academicData}>
      {children}
    </AcademicContext.Provider>
  );
};
