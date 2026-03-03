"use client";

import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, Play, Square, Share2, AlertCircle, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
    const [folder, setFolder] = useState<string | null>(null);

    const [isRunning, setIsRunning] = useState(false);
    const [publicUrl, setPublicUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tunnelPassword, setTunnelPassword] = useState<string | null>(null);

    const handleSelectFolder = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select a folder to share with your phone"
            });
            if (selected) {
                setFolder(selected as string);
                if (isRunning) {
                    setIsRunning(false);
                    setPublicUrl(null);
                }
            }
        } catch (err) {
            console.error("Failed to open dialog:", err);
            setError("Failed to open folder selector.");
        }
    };

    const handleToggleServer = async () => {
        if (!folder) return;

        if (isRunning) {
            setIsLoading(true);
            try {
                await invoke("stop_server");
                setIsRunning(false);
                setPublicUrl(null);
                setTunnelPassword(null);
            } catch (err) {
                console.error("Failed to stop server:", err);
                setError(String(err));
            } finally {
                setIsLoading(false);
            }
            return;
        }

        setError(null);
        setIsLoading(true);
        try {
            const url: string = await invoke("start_server", { folderPath: folder, useNgrok: true });
            setPublicUrl(url);

            try {
                const res = await fetch("https://api.ipify.org");
                const ip = await res.text();
                setTunnelPassword(ip.trim());
            } catch (err) {
                console.warn("Could not fetch tunnel password:", err);
            }

            setIsRunning(true);
        } catch (err) {
            console.error("Failed to start server:", err);
            setError(String(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans items-center justify-center p-6 relative">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full point-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full point-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl"
            >
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Share2 className="w-10 h-10 text-white" />
                    </div>

                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            FileBridge
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">
                            Seamlessly share and manage PC files from your phone
                        </p>
                    </div>

                    <div className="w-full space-y-6 mt-4">
                        {/* Folder Selection */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSelectFolder}
                            className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${folder
                                ? 'bg-slate-800/80 border-blue-500/50 hover:bg-slate-800'
                                : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/80 border-dashed'
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-xl ${folder ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                                    <FolderOpen className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-slate-200">
                                        {folder ? "Selected Directory" : "Select Folder to Share"}
                                    </p>
                                    <p className="text-sm text-slate-400 truncate max-w-[300px]">
                                        {folder || "No folder selected yet"}
                                    </p>
                                </div>
                            </div>
                            {folder && <CheckCircle2 className="w-6 h-6 text-blue-400" />}
                        </motion.button>



                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-300 text-left">{error}</p>
                            </motion.div>
                        )}

                        {/* Action Button */}
                        <motion.button
                            whileHover={folder ? { scale: 1.02 } : {}}
                            whileTap={folder ? { scale: 0.98 } : {}}
                            onClick={handleToggleServer}
                            disabled={!folder || isLoading}
                            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 transition-all ${!folder
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : isRunning
                                    ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/50'
                                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/25'
                                }`}
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : isRunning ? (
                                <>
                                    <Square className="w-5 h-5 fill-current" />
                                    <span>Stop Server</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5 fill-current" />
                                    <span>Start Sharing</span>
                                </>
                            )}
                        </motion.button>

                        {/* Server Active Details */}
                        <AnimatePresence>
                            {isRunning && publicUrl && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, y: -20 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4 }}
                                    className="pt-6 border-t border-slate-800 overflow-hidden"
                                >
                                    <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 bg-slate-950/50 rounded-2xl p-6 border border-slate-800/80">
                                        <div className="bg-white p-3 rounded-xl shadow-inner shrink-0">
                                            <QRCodeSVG
                                                value={publicUrl}
                                                size={160}
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>
                                        <div className="flex flex-col items-center md:items-start space-y-3 text-center md:text-left w-full min-w-0">
                                            <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full text-sm font-medium">
                                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                                <span>Server Live</span>
                                            </div>
                                            <p className="text-slate-300">
                                                Scan the QR code with your phone's camera to connect.
                                            </p>
                                            <div className="bg-slate-900 rounded-xl p-3 w-full border border-slate-800 flex items-center justify-between group mt-2 shadow-inner">
                                                <div className="flex flex-col items-start overflow-hidden mr-3">
                                                    <span className="text-[10px] text-slate-500 font-semibold mb-0.5 uppercase tracking-widest">Public Link</span>
                                                    <span className="text-sm text-slate-300 font-mono truncate w-full text-left">
                                                        {publicUrl}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(publicUrl)}
                                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors shrink-0"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            {tunnelPassword && (
                                                <div className="bg-slate-900 rounded-xl p-3 w-full border border-slate-800 flex items-center justify-between group mt-2 shadow-inner">
                                                    <div className="flex flex-col items-start overflow-hidden mr-3">
                                                        <span className="text-[10px] text-slate-500 font-semibold mb-0.5 uppercase tracking-widest">Tunnel Password</span>
                                                        <span className="text-sm text-slate-300 font-mono truncate w-full text-left">
                                                            {tunnelPassword}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(tunnelPassword)}
                                                        className="text-blue-400 hover:text-blue-300 text-sm font-medium px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors shrink-0"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </div>
            </motion.div>
        </main>
    );
}
