import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, BookOpen, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import StatsCard from '@/components/StatsCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { initDB, getDB } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/hooks/useSettings';
import { useBusiness } from '@/contexts/BusinessContext';

export default function Students() {
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const settings = useSettings();
  const currency = settings?.currency ?? 'Rs';

  useEffect(() => {
    loadStudents();
  }, [activeBusiness]);

  const loadStudents = async () => {
    await initDB(activeBusiness);
    const currentDB = getDB(activeBusiness);
    const studentsData = await currentDB.students.toArray();

    const studentsWithBalance = await Promise.all(
      studentsData.map(async (student) => {
        const ledger = await currentDB.studentLedger.where('studentId').equals(student.id).toArray();
        const totalCharged = ledger
          .filter(e => e.type === 'charge' || e.type === 'purchase')
          .reduce((sum, e) => sum + e.amount, 0);
        const totalPaid = ledger
          .filter(e => e.type === 'payment')
          .reduce((sum, e) => sum + e.amount, 0);
        return {
          ...student,
          balance: totalCharged - totalPaid,
          totalPaid
        };
      })
    );

    setStudents(studentsWithBalance);
  };

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.fatherName.toLowerCase().includes(query) ||
        student.rollNumber.toLowerCase().includes(query)
      );
    }

    if (classFilter !== 'All Classes') {
      filtered = filtered.filter(student => student.class === classFilter);
    }

    return filtered;
  }, [students, searchQuery, classFilter]);

  const uniqueClasses = useMemo(() => {
    const classes = [...new Set(students.map(s => s.class).filter(Boolean))];
    return classes.sort();
  }, [students]);

  const totalStudents = students.length;
  const totalOwed = students.reduce((sum, s) => sum + Math.max(0, s.balance), 0);
  const totalPaid = students.reduce((sum, s) => sum + s.totalPaid, 0);

  const getBalanceColor = (balance) => {
    if (balance === 0) return 'text-green-600';
    if (balance <= 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleEditStudent = (student) => {
    setEditStudent(student);
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent?.id) return;
    const currentDB = getDB(activeBusiness);
    await currentDB.students.delete(selectedStudent.id);
    await currentDB.studentLedger.where('studentId').equals(selectedStudent.id).delete();
    setStudents((current) => current.filter((s) => s.id !== selectedStudent.id));
    setConfirmDelete(false);
    setSelectedStudent(null);
  };

  const handleSaveStudent = async (formData, isEdit = false) => {
    const currentDB = getDB(activeBusiness);
    
    if (isEdit && formData.id) {
      await currentDB.students.update(formData.id, {
        name: formData.name,
        fatherName: formData.fatherName,
        rollNumber: formData.rollNumber,
        phone: formData.phone || '',
        fatherPhone: formData.fatherPhone || '',
        class: formData.class || '',
        address: formData.address || '',
      });
      setStudents((current) =>
        current.map((s) =>
          s.id === formData.id ? { ...s, ...formData } : s
        )
      );
    } else {
      const studentId = await currentDB.students.add({
        name: formData.name,
        fatherName: formData.fatherName,
        rollNumber: formData.rollNumber,
        phone: formData.phone || '',
        fatherPhone: formData.fatherPhone || '',
        class: formData.class || '',
        address: formData.address || '',
        createdAt: new Date().toISOString()
      });

      if (formData.openingBalance && formData.openingBalance > 0) {
        await currentDB.studentLedger.add({
          studentId,
          type: 'charge',
          amount: Number(formData.openingBalance),
          description: 'Opening balance',
          date: new Date().toISOString()
        });
      }
      
      await loadStudents();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Manage student accounts and fee tracking" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Students"
          value={totalStudents.toString()}
          description="Active student accounts"
        />
        <StatsCard
          title="Total Owed"
          value={formatCurrency(totalOwed, currency)}
          description="Outstanding balances"
        />
        <StatsCard
          title="Total Paid"
          value={formatCurrency(totalPaid, currency)}
          description="Payments received"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, roll number, father name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] border rounded-lg px-4 py-2"
        />
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option>All Classes</option>
          {uniqueClasses.map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setEditStudent(null);
            setAddModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Student
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Father Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Father Ph</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.rollNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{student.fatherName}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{student.class}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{student.fatherPhone}</td>
                <td className={`px-4 py-3 text-sm font-medium ${getBalanceColor(student.balance)}`}>
                  {formatCurrency(student.balance, currency)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/students/${student.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Khata"
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditStudent(student)}
                      className="text-gray-600 hover:text-gray-800"
                      title="Edit Student"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setConfirmDelete(true);
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Student"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStudents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No students found
          </div>
        )}
      </div>

      {(addModalOpen || editStudent) && (
        <StudentModal
          student={editStudent}
          onClose={() => {
            setAddModalOpen(false);
            setEditStudent(null);
          }}
          onSave={(formData) => {
            handleSaveStudent(formData, !!editStudent);
            setAddModalOpen(false);
            setEditStudent(null);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete student"
        description="This will remove the student and all their ledger entries. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDeleteStudent}
      />
    </div>
  );
}

function StudentModal({ student, onClose, onSave }) {
  const [formData, setFormData] = useState({
    id: student?.id || null,
    name: student?.name || '',
    fatherName: student?.fatherName || '',
    rollNumber: student?.rollNumber || '',
    phone: student?.phone || '',
    fatherPhone: student?.fatherPhone || '',
    class: student?.class || '',
    address: student?.address || '',
    openingBalance: 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{student ? 'Edit Student' : 'Add New Student'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Student Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="e.g. Ali Khan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Roll Number *</label>
              <input
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="e.g. 2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Father Name *</label>
              <input
                type="text"
                required
                value={formData.fatherName}
                onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="e.g. Ahmad Khan"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Class / Grade 
                <span className="text-gray-400 font-normal text-xs"> (optional)</span>
              </label>
              <input
                type="text"
                value={formData.class}
                onChange={(e) => setFormData({...formData, class: e.target.value})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="e.g. Class 5 or Grade 10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Father Phone 
                <span className="text-gray-400 font-normal text-xs"> (optional)</span>
              </label>
              <input
                type="tel"
                value={formData.fatherPhone}
                onChange={(e) => setFormData({...formData, fatherPhone: e.target.value})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="e.g. 0312-1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Student Phone 
                <span className="text-gray-400 font-normal text-xs"> (optional)</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="Optional"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address 
                <span className="text-gray-400 font-normal text-xs"> (optional)</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="Home address"
              />
            </div>

            {!student && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Opening Balance (Rs)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({...formData, openingBalance: Number(e.target.value)})}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">
                  If student already owes money, enter amount here
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {student ? 'Update Student' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}