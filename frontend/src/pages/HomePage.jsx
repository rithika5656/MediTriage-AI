import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Calendar, Phone, HeartPulse, Stethoscope, Brain, Bone, Baby, Flame, ArrowRight, User } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white text-slate-800 font-sans">

            {/* Navbar matching screenshot 1 */}
            <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white p-1.5 rounded-md">
                        <Activity className="w-5 h-5" strokeWidth={3} />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-slate-900">MediTriage-AI</span>
                </div>

                <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-500">
                    <a href="#treatments" className="hover:text-blue-600 transition-colors">Treatments</a>
                    <a href="#symptoms" className="hover:text-blue-600 transition-colors">Symptoms</a>
                    <a href="#helplines" className="hover:text-blue-600 transition-colors">Our Helplines</a>
                    <a href="#expert-team" className="hover:text-blue-600 transition-colors">Expert Team</a>
                    <a href="#success" className="hover:text-blue-600 transition-colors">Success Stories</a>
                    <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
                </div>

                <div className="flex items-center gap-4">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all">
                        Book Appointment
                    </button>
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold relative cursor-pointer">
                        A
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        </span>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-8">

                {/* Hero Section matching screenshot 1 */}
                <section className="flex flex-col lg:flex-row items-center pt-16 pb-24 gap-12">
                    <div className="lg:w-1/2 space-y-8">
                        <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide">
                            Smart Patient Care.
                        </div>

                        <h1 className="text-5xl lg:text-6xl font-black leading-[1.1] text-slate-900">
                            Advanced<br />
                            Healthcare,<br />
                            <span className="text-blue-600">Personalized for You.</span>
                        </h1>

                        <p className="text-lg text-slate-500 leading-relaxed max-w-md">
                            Experience world-class medical expertise supported by intelligent triage technology. Get the right care, right when you need it.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition-all">
                                <Calendar className="w-5 h-5" />
                                Book Appointment
                            </button>
                            <button className="bg-white hover:bg-gray-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition-all shadow-sm">
                                <Phone className="w-5 h-5" />
                                Talk to a Specialist
                            </button>
                        </div>
                    </div>

                    <div className="lg:w-1/2 pt-8 lg:pt-0">
                        {/* Using a styled div to represent the hospital image from screenshot */}
                        <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/3] bg-slate-100">
                            <img
                                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop"
                                alt="Hospital Room"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-8">
                                <h3 className="text-white text-2xl font-bold">MGM Healthcare</h3>
                                <p className="text-white/80">Premium Partner Network</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features banner matching screenshot 3/4 */}
                <section className="py-12 border-t border-b border-gray-100 flex justify-between gap-8 mb-24 overflow-x-auto">
                    <div className="text-center w-1/3 min-w-[200px]">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                            <Stethoscope className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-lg mb-2 text-slate-900">Expert Doctors</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Our team comprises board-certified specialists across all major medical fields.</p>
                    </div>
                    <div className="text-center w-1/3 min-w-[200px]">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-lg mb-2 text-slate-900">Advanced Tech</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">State-of-the-art facilities equipped with modern diagnostic AI tools.</p>
                    </div>
                    <div className="text-center w-1/3 min-w-[200px]">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                            <Phone className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-lg mb-2 text-slate-900">24/7 Support</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Round-the-clock emergency care and continuous virtual assistance.</p>
                    </div>
                </section>

                {/* Specialties Section matching screenshot 2/3 */}
                <section id="treatments" className="py-16">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-slate-900 mb-4">Our Specialties</h2>
                        <p className="text-slate-500">Comprehensive care tailored to your specific health needs.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-[#f8f9fc] p-8 rounded-3xl hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-blue-600 flex items-center justify-center mb-6">
                                <HeartPulse className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Cardiology</h3>
                            <p className="text-slate-500 text-sm mb-6">Heart health and cardiovascular treatments.</p>
                            <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Learn more <ArrowRight className="w-4 h-4" /></span>
                        </div>

                        <div className="bg-[#f8f9fc] p-8 rounded-3xl hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-blue-600 flex items-center justify-center mb-6">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">General Surgery</h3>
                            <p className="text-slate-500 text-sm mb-6">Minimally invasive and standard procedures.</p>
                            <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Learn more <ArrowRight className="w-4 h-4" /></span>
                        </div>

                        <div className="bg-[#f8f9fc] p-8 rounded-3xl hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-blue-600 flex items-center justify-center mb-6">
                                <Brain className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Neurology</h3>
                            <p className="text-slate-500 text-sm mb-6">Brain, spinal cord, and nervous system care.</p>
                            <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Learn more <ArrowRight className="w-4 h-4" /></span>
                        </div>

                        <div className="bg-[#f8f9fc] p-8 rounded-3xl hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-blue-600 flex items-center justify-center mb-6">
                                <Bone className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Orthopedics</h3>
                            <p className="text-slate-500 text-sm mb-6">Bone, joint, and muscle treatments.</p>
                            <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Learn more <ArrowRight className="w-4 h-4" /></span>
                        </div>

                        <div className="bg-[#f8f9fc] p-8 rounded-3xl hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-blue-600 flex items-center justify-center mb-6">
                                <Baby className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Pediatrics</h3>
                            <p className="text-slate-500 text-sm mb-6">Comprehensive healthcare for children.</p>
                            <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Learn more <ArrowRight className="w-4 h-4" /></span>
                        </div>

                        <div className="bg-[#f8f9fc] p-8 rounded-3xl hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-blue-600 flex items-center justify-center mb-6">
                                <Flame className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Emergency</h3>
                            <p className="text-slate-500 text-sm mb-6">24/7 critical care and trauma services.</p>
                            <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Learn more <ArrowRight className="w-4 h-4" /></span>
                        </div>
                    </div>
                </section>

                {/* Meet Our Specialists matching screenshot 4 */}
                <section id="expert-team" className="py-24">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 mb-2">Meet Our Specialists</h2>
                            <p className="text-slate-500">Dedicated professionals committed to your health.</p>
                        </div>
                        <a href="#" className="hidden lg:flex text-blue-600 font-semibold items-center gap-2 hover:gap-3 transition-all">
                            View all doctors <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Dr 1 */}
                        <div className="bg-white border border-gray-100 p-6 rounded-3xl hover:shadow-xl transition-shadow text-center flex flex-col items-center">
                            <div className="w-24 h-24 mb-4 rounded-full overflow-hidden bg-yellow-400">
                                <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=250&auto=format&fit=crop" alt="Doctor" className="w-full h-full object-cover" />
                            </div>
                            <h4 className="font-bold text-lg text-slate-900">Dr. K.R. Balakrishnan</h4>
                            <p className="text-blue-600 text-sm mb-6">Chief Cardiologist</p>
                            <button className="w-full py-2.5 rounded-xl border border-gray-200 text-slate-700 font-semibold hover:bg-gray-50 transition-colors mt-auto">Book Visit</button>
                        </div>

                        {/* Dr 2 */}
                        <div className="bg-white border border-gray-100 p-6 rounded-3xl hover:shadow-xl transition-shadow text-center flex flex-col items-center shadow-lg shadow-blue-900/5 -translate-y-2 relative">
                            <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            <div className="w-24 h-24 mb-4 rounded-full overflow-hidden bg-blue-100">
                                <img src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=250&auto=format&fit=crop" alt="Doctor" className="w-full h-full object-cover" />
                            </div>
                            <h4 className="font-bold text-lg text-slate-900">Dr. P.V.A. Mohandas</h4>
                            <p className="text-blue-600 text-sm mb-6">Chief Orthopedic Surgeon</p>
                            <button className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors mt-auto">Book Visit</button>
                        </div>

                        {/* Dr 3 */}
                        <div className="bg-white border border-gray-100 p-6 rounded-3xl hover:shadow-xl transition-shadow text-center flex flex-col items-center">
                            <div className="w-24 h-24 mb-4 rounded-full overflow-hidden bg-slate-100">
                                <img src="https://images.unsplash.com/photo-1582750433449-648ed127d09e?q=80&w=250&auto=format&fit=crop" alt="Doctor" className="w-full h-full object-cover" />
                            </div>
                            <h4 className="font-bold text-lg text-slate-900">Dr. Mettu Srinivas Reddy</h4>
                            <p className="text-blue-600 text-sm mb-6">Senior Surgeon & Liver Transplant</p>
                            <button className="w-full py-2.5 rounded-xl border border-gray-200 text-slate-700 font-semibold hover:bg-gray-50 transition-colors mt-auto">Book Visit</button>
                        </div>

                        {/* Dr 4 */}
                        <div className="bg-white border border-gray-100 p-6 rounded-3xl hover:shadow-xl transition-shadow text-center flex flex-col items-center">
                            <div className="w-24 h-24 mb-4 rounded-full overflow-hidden bg-slate-100">
                                <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=250&auto=format&fit=crop" alt="Doctor" className="w-full h-full object-cover" />
                            </div>
                            <h4 className="font-bold text-lg text-slate-900">Dr. Aravindan Selvaraj</h4>
                            <p className="text-blue-600 text-sm mb-6">Chief Orthopedic Surgeon</p>
                            <button className="w-full py-2.5 rounded-xl border border-gray-200 text-slate-700 font-semibold hover:bg-gray-50 transition-colors mt-auto">Book Visit</button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Floating Chat Icon */}
            <div className="fixed bottom-6 right-6">
                <Link to="/chat" className="w-14 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105">
                    <svg xmlns="http://www.w3.org/-2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </Link>
            </div>
        </div>
    );
}
