/**
 * Appointment Service
 * Returns mock data matching the component's expected structure to prevent undefined errors
 */

const mockAppointments = [
  { id: 101, doctor_name: "Dr. K.R. Balakrishnan", datetime: "2026-03-05T10:30:00Z", status: "confirmed", symptoms_summary: "Mild chest pain" },
  { id: 102, doctor_name: "Dr. P.V.A. Mohandas", datetime: "2026-03-10T14:00:00Z", status: "pending", symptoms_summary: "Knee pain" }
];

const mockHospitals = [
  { id: 1, name: "MGM Healthcare", status: "Premium Partner", emergency: "Available" },
  { id: 2, name: "Apollo Hospitals", status: "Partner", emergency: "Available" }
];

const appointmentService = {
  getAppointments: async (params = {}) => {
    return { appointments: mockAppointments }
  },
  bookAppointment: async (data) => {
    return { success: true, message: "Appointment booked successfully", data: { ...data, id: 102 } }
  },
  bookEmergency: async (data) => {
    return { success: true, message: "Emergency appointment prioritized", data: { ...data, id: 103, status: "emergency" } }
  },
  getAppointment: async (id) => {
    return mockAppointments[0]
  },
  cancelAppointment: async (id) => {
    return { success: true, message: "Appointment cancelled" }
  },
  getHospitals: async () => {
    return { hospitals: mockHospitals }
  }
}

export default appointmentService
