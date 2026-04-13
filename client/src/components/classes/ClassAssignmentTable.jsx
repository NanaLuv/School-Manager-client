// import React from "react";
// import {
//   PencilIcon,
//   TrashIcon,
//   ArrowRightIcon,
//   UserIcon,
//   CalendarDaysIcon,
// } from "@heroicons/react/24/outline";

// const ClassAssignmentTable = ({
//   assignments,
//   students,
//   classes,
//   academicYears,
//   terms,
//   onEdit,
//   onDelete,
//   onPromote,
//   emptyMessage,
// }) => {
//   const getStudentName = (studentId) => {
//     const student = students.find((s) => s.id === studentId);
//     return student
//       ? `${student.first_name} ${student.last_name}`
//       : "Unknown Student";
//   };

//   const getStudentAdmission = (studentId) => {
//     const student = students.find((s) => s.id === studentId);
//     return student ? student.admission_number : "N/A";
//   };

//   const getClassName = (classId) => {
//     const cls = classes.find((c) => c.id === classId);
//     return cls ? cls.class_name : "Unknown Class";
//   };

//   const getAcademicYear = (yearId) => {
//     const year = academicYears.find((y) => y.id === yearId);
//     return year ? year.year_label : "Unknown Year";
//   };

//   const getPromotionStatusColor = (status) => {
//     switch (status) {
//       case "Promoted":
//         return "bg-green-100 text-green-800";
//       case "Not Promoted":
//         return "bg-red-100 text-red-800";
//       case "Conditional":
//         return "bg-yellow-100 text-yellow-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   // Get current term for this academic year
//   const getCurrentTerm = (academicYearId) => {
//     console.log(academicYearId);
//     const yearTerms = terms.filter(
//       (term) => term.academic_year_id === academicYearId
//     );
//     const today = new Date();

//     const currentTerm = yearTerms.find((term) => {
//       const startDate = new Date(term.start_date);
//       const endDate = new Date(term.end_date);
//       return today >= startDate && today <= endDate;
//     });

//     return currentTerm || yearTerms[yearTerms.length - 1]; // Return current or last term
//   };

//   // Get next class for promotion (year-to-year move)
//   const getNextClass = (currentClassId) => {
//     const currentClass = classes.find((c) => c.id === currentClassId);
//     if (!currentClass) return null;

//     // Simple logic: if class name contains numbers, increment them
//     const match = currentClass.class_name.match(/(\d+)/);
//     if (match) {
//       const currentNumber = parseInt(match[1]);
//       const nextNumber = currentNumber + 1;
//       const nextClassName = currentClass.class_name.replace(
//         match[1],
//         nextNumber
//       );
//       return classes.find((c) => c.class_name === nextClassName);
//     }

//     return null;
//   };

//   if (!assignments || assignments.length === 0) {
//     return (
//       <div className="text-center py-8">
//         <p className="text-gray-500">{emptyMessage}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="overflow-x-auto">
//       <table className="min-w-full divide-y divide-gray-200">
//         <thead className="bg-gray-50">
//           <tr>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Student
//             </th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Admission No.
//             </th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Class
//             </th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Academic Year
//             </th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Current Term
//             </th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Year Status
//             </th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Actions
//             </th>
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-200">
//           {assignments.map((assignment) => {
//             const nextClass = getNextClass(assignment.class_id);
//             const currentTerm = getCurrentTerm(assignment.academic_year_id);

//             return (
//               <tr key={assignment.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
//                       <UserIcon className="w-5 h-5 text-blue-600" />
//                     </div>
//                     <div className="ml-4">
//                       <div className="text-sm font-medium text-gray-900">
//                         {getStudentName(assignment.student_id)}
//                       </div>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm text-gray-900">
//                     {getStudentAdmission(assignment.student_id)}
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm font-medium text-gray-900">
//                     {getClassName(assignment.class_id)}
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm text-gray-900">
//                     {getAcademicYear(assignment.academic_year_id)}
//                   </div>
//                   <div className="text-xs text-gray-500">
//                     Full year enrollment
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   {currentTerm ? (
//                     <div className="flex items-center">
//                       <CalendarDaysIcon className="w-4 h-4 text-gray-400 mr-1" />
//                       <span className="text-sm text-gray-900">
//                         {currentTerm.term_name}
//                       </span>
//                     </div>
//                   ) : (
//                     <span className="text-sm text-gray-500">No terms set</span>
//                   )}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span
//                     className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPromotionStatusColor(
//                       assignment.promotion_status
//                     )}`}
//                   >
//                     {assignment.promotion_status}
//                   </span>
//                   <div className="text-xs text-gray-500 mt-1">
//                     End-of-year status
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                   <div className="flex space-x-2">
//                     {nextClass && assignment.promotion_status === "Pending" && (
//                       <button
//                         onClick={() => onPromote(assignment.id, nextClass.id)}
//                         className="text-green-600 hover:text-green-900 flex items-center"
//                         title="Promote to Next Academic Year"
//                       >
//                         <ArrowRightIcon className="w-4 h-4 mr-1" />
//                         <span className="text-xs">Promote</span>
//                       </button>
//                     )}
//                     <button
//                       onClick={() => onEdit(assignment)}
//                       className="text-emerald-600 hover:text-emerald-900"
//                       title="Edit Enrollment"
//                     >
//                       <PencilIcon className="w-5 h-5" />
//                     </button>
//                     <button
//                       onClick={() => onDelete(assignment.id)}
//                       className="text-red-600 hover:text-red-900"
//                       title="Remove from Class"
//                     >
//                       <TrashIcon className="w-5 h-5" />
//                     </button>
//                   </div>
//                   <div className="text-xs text-gray-500 mt-1">
//                     {nextClass && "To next year"}
//                   </div>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default ClassAssignmentTable;
// Add these imports at the top
import {
  PencilIcon,
  TrashIcon,
  ArrowRightIcon,
  UserIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const ClassAssignmentTable = ({
  assignments,
  students,
  classes,
  academicYears,
  terms,
  onEdit,
  onDelete,
  onPromote,
  emptyMessage,
  pagination, // Add this prop
  onPageChange // Add this prop for pagination
}) => {
  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student
      ? `${student.first_name} ${student.last_name}`
      : "Unknown Student";
  };

  const getStudentAdmission = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student ? student.admission_number : "N/A";
  };

  const getClassName = (classId) => {
    const cls = classes.find((c) => c.id === classId);
    return cls ? cls.class_name : "Unknown Class";
  };

  const getAcademicYear = (yearId) => {
    const year = academicYears.find((y) => y.id === yearId);
    return year ? year.year_label : "Unknown Year";
  };

  const getPromotionStatusColor = (status) => {
    switch (status) {
      case "Promoted":
        return "bg-green-100 text-green-800";
      case "Not Promoted":
        return "bg-red-100 text-red-800";
      case "Conditional":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get current term for this academic year
  const getCurrentTerm = (academicYearId) => {
    const yearTerms = terms.filter(
      (term) => term.academic_year_id === academicYearId
    );
    const today = new Date();

    const currentTerm = yearTerms.find((term) => {
      const startDate = new Date(term.start_date);
      const endDate = new Date(term.end_date);
      return today >= startDate && today <= endDate;
    });

    return currentTerm || yearTerms[yearTerms.length - 1]; // Return current or last term
  };

  // Get next class for promotion (year-to-year move)
  const getNextClass = (currentClassId) => {
    const currentClass = classes.find((c) => c.id === currentClassId);
    if (!currentClass) return null;

    // Simple logic: if class name contains numbers, increment them
    const match = currentClass.class_name.match(/(\d+)/);
    if (match) {
      const currentNumber = parseInt(match[1]);
      const nextNumber = currentNumber + 1;
      const nextClassName = currentClass.class_name.replace(
        match[1],
        nextNumber
      );
      return classes.find((c) => c.class_name === nextClassName);
    }

    return null;
  };

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admission No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Academic Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Term
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignments.map((assignment) => {
              const nextClass = getNextClass(assignment.class_id);
              const currentTerm = getCurrentTerm(assignment.academic_year_id);

              return (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getStudentName(assignment.student_id)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getStudentAdmission(assignment.student_id)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getClassName(assignment.class_id)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getAcademicYear(assignment.academic_year_id)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Full year enrollment
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentTerm ? (
                      <div className="flex items-center">
                        <CalendarDaysIcon className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {currentTerm.term_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No terms set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPromotionStatusColor(
                        assignment.promotion_status
                      )}`}
                    >
                      {assignment.promotion_status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      End-of-year status
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {nextClass && assignment.promotion_status === "Pending" && (
                        <button
                          onClick={() => onPromote(assignment.id, nextClass.id)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="Promote to Next Academic Year"
                        >
                          <ArrowRightIcon className="w-4 h-4 mr-1" />
                          <span className="text-xs">Promote</span>
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(assignment)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Edit Enrollment"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(assignment.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Remove from Class"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {nextClass && "To next year"}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.hasPrevPage
                  ? 'bg-white text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.hasNextPage
                  ? 'bg-white text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                    !pagination.hasPrevPage ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.page === pageNum
                          ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                    !pagination.hasNextPage ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClassAssignmentTable;