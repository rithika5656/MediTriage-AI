/**
 * Doctor Service
 * Returns mock data with 40 doctors from Chennai and Coimbatore
 */

const mockDoctors = [
  // Chennai Doctors
  { id: 1, name: "Dr. G. Balamurali", specialization: "Spine & Neurosurgery", hospital: "Kauvery Hospital", city: "Chennai", qualification: "MS, MCh", experience_years: 22, available: true, rating: 4.9 },
  { id: 2, name: "Dr. K. P. Suresh Kumar", specialization: "Cardiology", hospital: "Kauvery Hospital", city: "Chennai", qualification: "MD, DM Cardiology", experience_years: 25, available: true, rating: 4.8 },
  { id: 3, name: "Dr. Siddhartha Ghosh", specialization: "Neurosurgery", hospital: "Apollo Proton Cancer Centre", city: "Chennai", qualification: "MCh Neurosurgery", experience_years: 30, available: true, rating: 4.9 },
  { id: 4, name: "Dr. S. Rajasundaram", specialization: "Surgical Oncology", hospital: "Iswarya Hospital (OMR)", city: "Chennai", qualification: "MS, MCh Oncology", experience_years: 21, available: true, rating: 4.7 },
  { id: 5, name: "Dr. Prithika Chary", specialization: "Neurology", hospital: "Kauvery Hospital", city: "Chennai", qualification: "MD, DM Neurology", experience_years: 35, available: true, rating: 4.9 },
  { id: 6, name: "Dr. K. Subramanyan", specialization: "Cardiology", hospital: "Iswarya Hospital", city: "Chennai", qualification: "MD, DM", experience_years: 18, available: true, rating: 4.6 },
  { id: 7, name: "Dr. R. Anantharaman", specialization: "Cardiology", hospital: "Kauvery Hospital", city: "Chennai", qualification: "MD, DM Cardiology", experience_years: 20, available: true, rating: 4.8 },
  { id: 8, name: "Dr. Aravindan R.", specialization: "Cardiology", hospital: "Rela Hospital", city: "Chennai", qualification: "MD, DM", experience_years: 15, available: true, rating: 4.7 },
  { id: 9, name: "Dr. S. Balasubramaniam", specialization: "Neurology", hospital: "Prashanth Hospitals", city: "Chennai", qualification: "MD, DM Neurology", experience_years: 24, available: true, rating: 4.8 },
  { id: 10, name: "Dr. V. Narendra Kumar", specialization: "Paediatric Cardiology", hospital: "Rela Hospital", city: "Chennai", qualification: "MD, FNB", experience_years: 16, available: true, rating: 4.7 },
  { id: 11, name: "Dr. Manoj Sivaramakrishnan", specialization: "Cardiology", hospital: "Kauvery Hospital", city: "Chennai", qualification: "MD, DM", experience_years: 14, available: true, rating: 4.6 },
  { id: 12, name: "Dr. P. Keerthivasan", specialization: "Neurosurgery", hospital: "Kauvery Hospital", city: "Chennai", qualification: "MS, MCh", experience_years: 12, available: true, rating: 4.5 },
  { id: 13, name: "Dr. M. P. Ram Prabu", specialization: "Medical Oncology", hospital: "Iswarya Hospital", city: "Chennai", qualification: "MD, DM Oncology", experience_years: 19, available: true, rating: 4.7 },
  { id: 14, name: "Dr. Deep Chandh Raja", specialization: "Cardiac Electrophysiology", hospital: "Kauvery Hospital", city: "Chennai", qualification: "MD, DM CEP", experience_years: 15, available: true, rating: 4.8 },
  { id: 15, name: "Dr. Preetha P.", specialization: "Neurology", hospital: "Prashanth Hospitals", city: "Chennai", qualification: "MD, DM Neurology", experience_years: 17, available: true, rating: 4.6 },
  { id: 16, name: "Dr. Priyadharshan K P", specialization: "Neurosurgery", hospital: "Prashanth Hospitals", city: "Chennai", qualification: "MS, MCh Neurosurgery", experience_years: 20, available: true, rating: 4.8 },
  { id: 17, name: "Dr. K. V. Karthikeyan", specialization: "Skull Base Surgery", hospital: "Prashanth Hospitals", city: "Chennai", qualification: "MS, MCh", experience_years: 22, available: true, rating: 4.9 },
  { id: 18, name: "Dr. G.S. Arun Narindar", specialization: "Neurosurgery", hospital: "Prashanth Hospitals", city: "Chennai", qualification: "MS, MCh", experience_years: 14, available: true, rating: 4.6 },
  { id: 19, name: "Dr. S. Socrates", specialization: "Cardiology", hospital: "Rela Hospital", city: "Chennai", qualification: "MD, DM", experience_years: 16, available: true, rating: 4.7 },
  { id: 20, name: "Dr. M. Dhanaraj", specialization: "Neurology", hospital: "Apollo Hospitals", city: "Chennai", qualification: "MD, DM Neurology", experience_years: 32, available: true, rating: 4.9 },

  // Coimbatore Doctors
  { id: 21, name: "Dr. P. Guhan", specialization: "Medical Oncology", hospital: "Sri Ramakrishna Hospital", city: "Coimbatore", qualification: "MD, DM Oncology", experience_years: 28, available: true, rating: 4.9 },
  { id: 22, name: "Dr. R. Parthasarathi", specialization: "Gastric Surgery", hospital: "GEM Hospital", city: "Coimbatore", qualification: "MS, FRCS", experience_years: 24, available: true, rating: 4.8 },
  { id: 23, name: "Dr. B. Prakash", specialization: "Neurology", hospital: "Kasturi Neuro Diagnostic", city: "Coimbatore", qualification: "MD, DM Neurology", experience_years: 18, available: true, rating: 4.7 },
  { id: 24, name: "Dr. S. K. Varma", specialization: "Cardiothoracic Surgery", hospital: "KG Hospital", city: "Coimbatore", qualification: "MS, MCh CTVS", experience_years: 26, available: true, rating: 4.8 },
  { id: 25, name: "Dr. A. Eswaran", specialization: "Cardiology", hospital: "Kumaran Medical Center", city: "Coimbatore", qualification: "MD, DM Cardiology", experience_years: 20, available: true, rating: 4.7 },
  { id: 26, name: "Dr. N. Krishna Priya", specialization: "Radiation Oncology", hospital: "Sri Ramakrishna Hospital", city: "Coimbatore", qualification: "MD Radiotherapy", experience_years: 15, available: true, rating: 4.6 },
  { id: 27, name: "Dr. S. Rajapandiyan", specialization: "Colorectal Surgery", hospital: "GEM Hospital", city: "Coimbatore", qualification: "MS, MCh", experience_years: 22, available: true, rating: 4.8 },
  { id: 28, name: "Dr. Manivasakan R.", specialization: "Neurology", hospital: "Balaji Neuro Centre", city: "Coimbatore", qualification: "MD, DM", experience_years: 16, available: true, rating: 4.6 },
  { id: 29, name: "Dr. K. Karthikesh", specialization: "Surgical Oncology", hospital: "Sri Ramakrishna Hospital", city: "Coimbatore", qualification: "MS, MCh Oncology", experience_years: 19, available: true, rating: 4.7 },
  { id: 30, name: "Dr. G. Murugesan", specialization: "Neurology", hospital: "Coimbatore Neuro Centre", city: "Coimbatore", qualification: "MD, DM Neurology", experience_years: 25, available: true, rating: 4.8 },
  { id: 31, name: "Dr. Ramakrishnan TCR", specialization: "Neurology", hospital: "SARKK Medical Centre", city: "Coimbatore", qualification: "MD, DM", experience_years: 30, available: true, rating: 4.9 },
  { id: 32, name: "Dr. Nalankilli. V. P", specialization: "Multi-Organ Transplant", hospital: "GEM Hospital", city: "Coimbatore", qualification: "MS, MCh Transplant", experience_years: 21, available: true, rating: 4.8 },
  { id: 33, name: "Dr. T. Karthika", specialization: "Radiation Oncology", hospital: "Sri Ramakrishna Hospital", city: "Coimbatore", qualification: "MD", experience_years: 14, available: true, rating: 4.5 },
  { id: 34, name: "Dr. S. Shanthanam", specialization: "Neurology", hospital: "Nalavint Medical Center", city: "Coimbatore", qualification: "MD, DM", experience_years: 17, available: true, rating: 4.6 },
  { id: 35, name: "Dr. V. Rajendran", specialization: "Cardiology", hospital: "Deepam Hospital", city: "Coimbatore", qualification: "MD, DM Cardiology", experience_years: 22, available: true, rating: 4.7 },
  { id: 36, name: "Dr. N. Anand Vijay", specialization: "Liver & Pancreas Surgery", hospital: "GEM Hospital", city: "Coimbatore", qualification: "MS, MCh", experience_years: 18, available: true, rating: 4.8 },
  { id: 37, name: "Dr. B. Nageswararaj", specialization: "Oncology", hospital: "Sri Ramakrishna Hospital", city: "Coimbatore", qualification: "MD, DM Oncology", experience_years: 16, available: true, rating: 4.6 },
  { id: 38, name: "Dr. S. Sivagnanam", specialization: "Emergency Medicine", hospital: "Kumaran Medical Center", city: "Coimbatore", qualification: "MD Emergency", experience_years: 12, available: true, rating: 4.5 },
  { id: 39, name: "Dr. T. S. Ramesh Kumar", specialization: "Gastroenterology", hospital: "Kumaran Medical Center", city: "Coimbatore", qualification: "MD, DM Gastro", experience_years: 20, available: true, rating: 4.8 },
  { id: 40, name: "Dr. V. Umamaheswari", specialization: "Psychiatry", hospital: "Kumaran Medical Center", city: "Coimbatore", qualification: "MD Psychiatry", experience_years: 15, available: true, rating: 4.7 }
];

const mockSlots = [
  { datetime: "2026-03-05T09:00:00Z", day: "Thu", date: "Mar 5", time: "09:00 AM" },
  { datetime: "2026-03-05T10:30:00Z", day: "Thu", date: "Mar 5", time: "10:30 AM" },
  { datetime: "2026-03-06T14:00:00Z", day: "Fri", date: "Mar 6", time: "02:00 PM" },
  { datetime: "2026-03-06T16:30:00Z", day: "Fri", date: "Mar 6", time: "04:30 PM" }
];

const doctorService = {
  getDoctors: async (params = {}) => {
    let filtered = mockDoctors;
    if (params.specialization) {
      filtered = filtered.filter(d => d.specialization === params.specialization);
    }
    if (params.city) {
      filtered = filtered.filter(d => d.city === params.city);
    }
    return { doctors: filtered }
  },
  getCities: async () => {
    return { cities: Array.from(new Set(mockDoctors.map(d => d.city))) }
  },
  getSpecializations: async () => {
    return { specializations: Array.from(new Set(mockDoctors.map(d => d.specialization))) }
  },
  getDoctor: async (id) => {
    return { doctor: mockDoctors.find(d => d.id == id) || mockDoctors[0] }
  },
  getSlots: async (id, date = null) => {
    return { available_slots: mockSlots }
  },
  searchDoctors: async (query) => {
    return {
      doctors: mockDoctors.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.specialization.toLowerCase().includes(query.toLowerCase()) ||
        d.hospital.toLowerCase().includes(query.toLowerCase())
      )
    }
  }
}

export default doctorService
