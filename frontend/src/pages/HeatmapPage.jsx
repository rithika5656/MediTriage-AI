import React, { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertTriangle, Activity } from 'lucide-react';

const HeatmapPage = () => {
    const mapRef = useRef(null);
    const layersRef = useRef({ markers: {}, clusters: [] });

    const [stats, setStats] = useState({ high: 0, total: 0, alert: false });

    // Custom Floorplan Blueprint bounds
    const bounds = [[0, 0], [1000, 1000]];

    const getRiskColor = (score) => {
        if (score > 0.6) return '#ef4444'; // Red-500
        if (score > 0.3) return '#eab308'; // Yellow-500
        return '#22c55e'; // Green-500
    };

    useEffect(() => {
        // Fix Leaflet StrictMode error by resetting internal id
        const container = document.getElementById('hospital-map');
        if (container && container._leaflet_id) {
            container._leaflet_id = null;
        }

        // Initialize map only once
        if (!mapRef.current) {
            const map = L.map('hospital-map', {
                crs: L.CRS.Simple,
                minZoom: -1,
                zoomControl: false,
                attributionControl: false
            });

            L.imageOverlay('/assets/hospital_floorplan_blueprint.svg', bounds).addTo(map);
            map.fitBounds(bounds);
            mapRef.current = map;
        }

        const map = mapRef.current;

        // Mock Realtime Generation for Hackathon demo
        const generateMockPatients = () => {
            const currentPatientIds = new Set();
            let highRiskCount = 0;
            let clusterCenter = { x: 0, y: 0 };

            for (let i = 1; i <= 20; i++) {
                const pid = `PAT-${1000 + i}`;
                currentPatientIds.add(pid);

                const x = Math.floor(Math.random() * 800) + 100;
                const y = Math.floor(Math.random() * 800) + 100;
                const risk_score = Math.random();

                let level = "Low";
                if (risk_score > 0.6) {
                    level = "High";
                    highRiskCount++;
                    clusterCenter.x += x;
                    clusterCenter.y += y;
                } else if (risk_score > 0.3) {
                    level = "Medium";
                }

                const temperature = (98.6 + Math.random() * 4).toFixed(1);
                const oxygen = Math.floor(90 + Math.random() * 10);

                const color = getRiskColor(risk_score);
                const radius = risk_score > 0.6 ? 14 : parseInt((risk_score * 10) + 4);
                const className = risk_score > 0.6 ? 'animate-pulse' : '';

                // Update or Create Marker
                if (layersRef.current.markers[pid]) {
                    const marker = layersRef.current.markers[pid];
                    marker.setLatLng([y, x]);
                    marker.setStyle({ fillColor: color, color: color, radius: radius, className: className });
                    marker.getPopup().setContent(`
                        <div class="p-1 min-w-[150px]">
                            <h3 style="font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px;">Patient ${pid}</h3>
                            <p style="margin: 0; font-size: 14px;">Status: <span style="color: ${color}; font-weight: bold;">${level}</span></p>
                            <p style="margin: 0; font-size: 14px;">Risk Score: ${(risk_score * 100).toFixed(1)}%</p>
                            <p style="margin-top: 4px; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 4px;">Temp: ${temperature}°F <br/>O2: ${oxygen}%</p>
                        </div>
                    `);
                } else {
                    const marker = L.circleMarker([y, x], {
                        fillColor: color,
                        color: color,
                        fillOpacity: risk_score > 0.6 ? 0.9 : 0.6,
                        weight: 2,
                        radius: radius,
                        className: className
                    }).addTo(map);

                    marker.bindPopup(`
                        <div class="p-1 min-w-[150px]">
                            <h3 style="font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px;">Patient ${pid}</h3>
                            <p style="margin: 0; font-size: 14px;">Status: <span style="color: ${color}; font-weight: bold;">${level}</span></p>
                            <p style="margin: 0; font-size: 14px;">Risk Score: ${(risk_score * 100).toFixed(1)}%</p>
                            <p style="margin-top: 4px; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 4px;">Temp: ${temperature}°F <br/>O2: ${oxygen}%</p>
                        </div>
                    `);

                    layersRef.current.markers[pid] = marker;
                }
            }

            // Clear old clusters
            layersRef.current.clusters.forEach(c => map.removeLayer(c));
            layersRef.current.clusters = [];

            let alertOutbreak = false;

            // Hackathon Outbreak Logic
            if (highRiskCount >= 3) {
                alertOutbreak = true;
                const cx = clusterCenter.x / highRiskCount;
                const cy = clusterCenter.y / highRiskCount;

                const outbreakCircle = L.circle([cy, cx], {
                    radius: 80,
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.15,
                    weight: 3,
                    dashArray: '10, 10'
                }).addTo(map);

                layersRef.current.clusters.push(outbreakCircle);
            }

            setStats({ high: highRiskCount, total: 20, alert: alertOutbreak });
        };

        generateMockPatients();
        const interval = setInterval(generateMockPatients, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 leading-tight">AI Outbreak Heatmap</h1>
                        <p className="text-xs text-gray-500 font-medium">Live Hospital Monitoring Tracking Mode</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${stats.alert ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                        {stats.alert ? 'OUTBREAK WARNING' : 'SYSTEM NORMAL'}
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-hidden">
                <div className="relative w-full h-full bg-slate-900 border-4 border-gray-800 rounded-xl overflow-hidden shadow-2xl">

                    {/* Hackathon Extra: Critical Outbreak Banner */}
                    {stats.alert && (
                        <div className="absolute top-6 flex justify-center w-full z-[1000] pointer-events-none">
                            <div className="bg-red-600 border-2 border-red-400 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse">
                                <AlertTriangle className="h-6 w-6" />
                                🚨 OUTBREAK CLUSTER DETECTED (Wards Compromised) 🚨
                            </div>
                        </div>
                    )}

                    <div id="hospital-map" style={{ width: '100%', height: '100%', backgroundColor: '#0f172a' }}></div>
                </div>
            </div>
        </div>
    );
};

export default HeatmapPage;
