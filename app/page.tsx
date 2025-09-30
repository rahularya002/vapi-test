"use client";

import { useState, useEffect } from "react";
import { Upload, Phone, Users, History, Settings, Play, Pause, Square, FileText, Download, Database, Trash2, Save } from "lucide-react";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface Candidate {
  id: number;
  name: string;
  phone: string;
  email: string;
  position: string;
  status: string;
  call_result?: string;
  call_notes?: string;
  call_time?: string;
}

interface CallConfiguration {
  method: "vapi";
  script: string;
  voiceSettings: {
    provider: string;
    voiceId: string;
    speed: number;
    pitch: number;
  };
  callSettings: {
    maxDuration: number;
    retryAttempts: number;
    delayBetweenCalls: number;
  };
}

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [callQueue, setCallQueue] = useState<Candidate[]>([]);
  const [callHistory, setCallHistory] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [currentCall, setCurrentCall] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "assistant" | "candidates" | "queue" | "history">("upload");
  const [dataLocation, setDataLocation] = useState("Loading...");
  const [callConfig, setCallConfig] = useState<CallConfiguration>({
    method: "vapi",
    script: `Hello! This is an automated call regarding your job application. Do you have a few minutes to answer some questions?

1. Can you tell me about yourself and your background?
2. What interests you about this position?
3. What are your key strengths and skills?
4. Do you have any questions about the role or company?
5. What is your availability for the next steps?

Thank you for your time!`,
    voiceSettings: {
      provider: "elevenlabs",
      voiceId: "adam",
      speed: 1.0,
      pitch: 1.0
    },
    callSettings: {
      maxDuration: 15,
      retryAttempts: 2,
      delayBetweenCalls: 30
    }
  });

  // Assistant configuration state
  const [assistantConfig, setAssistantConfig] = useState({
    name: "Interview Assistant",
    language: "en", // Default to English
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 1000
    },
    voice: {
      provider: "elevenlabs",
      voiceId: "adam",
      speed: 1.0,
      pitch: 1.0
    },
    transcription: {
      provider: "deepgram",
      model: "nova-2",
      language: "multi"
    },
    instructions: `You are a professional interview assistant conducting phone interviews for job candidates. 

Your role is to:
1. Greet the candidate professionally
2. Ask relevant interview questions
3. Listen actively to their responses
4. Take notes of key information
5. Be friendly but professional
6. If they ask to speak to a human, explain this is an automated screening
7. Thank them for their time at the end

Always be respectful, patient, and professional.`,
    maxDurationSeconds: 600,
    interruptionThreshold: 1000,
    backgroundSound: "office",
    silenceTimeoutSeconds: 5,
    responseDelaySeconds: 0.5
  });

  const [assistantStatus, setAssistantStatus] = useState({
    isConfigured: false,
    assistantId: null as string | null,
    lastTested: null as string | null
  });

  // Assistant configuration functions
  const testAssistantConnection = async () => {
    try {
      const response = await fetch("/api/test-vapi-assistant");
      const result = await response.json();
      
      if (result.success) {
        setAssistantStatus(prev => ({
          ...prev,
          isConfigured: result.data.assistants.hasRequiredAssistant,
          assistantId: result.data.assistants.requiredAssistantId,
          lastTested: new Date().toISOString()
        }));
        alert("Assistant connection successful!");
      } else {
        alert(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error testing assistant connection:", error);
      alert("Error testing assistant connection");
    }
  };

  const createTestAssistant = async () => {
    try {
      const response = await fetch("/api/test-vapi-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testAssistant: true })
      });
      const result = await response.json();
      
      if (result.success) {
        setAssistantStatus(prev => ({
          ...prev,
          isConfigured: true,
          assistantId: result.assistant.id,
          lastTested: new Date().toISOString()
        }));
        alert(`Test assistant created successfully! ID: ${result.assistant.id}`);
      } else {
        alert(`Failed to create test assistant: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating test assistant:", error);
      alert("Error creating test assistant");
    }
  };

  const loadAssistantConfig = async () => {
    try {
      const response = await fetch("/api/assistant");
      const result = await response.json();
      
      if (response.ok) {
        setAssistantConfig(prev => ({
          ...prev,
          name: result.name || prev.name,
          language: result.language || prev.language,
          model: result.model || prev.model,
          voice: result.voice || prev.voice,
          transcription: result.transcription || prev.transcription,
          instructions: result.instructions || prev.instructions
        }));
        alert("Assistant configuration loaded successfully!");
      } else {
        alert("Failed to load assistant configuration");
      }
    } catch (error) {
      console.error("Error loading assistant config:", error);
      alert("Error loading assistant configuration");
    }
  };

  const loadExistingHindiAssistant = async () => {
    try {
      // Get your existing Hindi assistant from VAPI
      const response = await fetch("/api/vapi-assistant");
      const result = await response.json();
      
      if (result.success && result.assistants.length > 0) {
        // Find Hindi assistant (you can customize this logic)
        const hindiAssistant = result.assistants.find((assistant: any) => 
          assistant.name.toLowerCase().includes('hindi') || 
          assistant.name.toLowerCase().includes('हिंदी')
        ) || result.assistants[0]; // Fallback to first assistant
        
        setAssistantStatus(prev => ({
          ...prev,
          isConfigured: true,
          assistantId: hindiAssistant.id,
          lastTested: new Date().toISOString()
        }));
        
        // Load the assistant configuration from VAPI
        const configResponse = await fetch(`/api/vapi-assistant?assistantId=${hindiAssistant.id}`);
        if (configResponse.ok) {
          const config = await configResponse.json();
          setAssistantConfig(prev => ({
            ...prev,
            name: config.assistant.name || prev.name,
            language: config.assistant.language || "hi",
            model: config.assistant.model || prev.model,
            voice: config.assistant.voice || prev.voice,
            transcription: config.assistant.transcription || prev.transcription,
            instructions: config.assistant.instructions || prev.instructions,
            maxDurationSeconds: config.assistant.maxDurationSeconds || prev.maxDurationSeconds,
            interruptionThreshold: config.assistant.interruptionThreshold || prev.interruptionThreshold,
            backgroundSound: config.assistant.backgroundSound || prev.backgroundSound,
            silenceTimeoutSeconds: config.assistant.silenceTimeoutSeconds || prev.silenceTimeoutSeconds,
            responseDelaySeconds: config.assistant.responseDelaySeconds || prev.responseDelaySeconds
          }));
        }
        
        alert(`Hindi assistant loaded successfully! ID: ${hindiAssistant.id}`);
      } else {
        alert("No assistants found. Please create one first.");
      }
    } catch (error) {
      console.error("Error loading Hindi assistant:", error);
      alert("Error loading Hindi assistant");
    }
  };

  const useVapiAssistantDirectly = async () => {
    try {
      // Get your existing Hindi assistant from VAPI
      const response = await fetch("/api/vapi-assistant");
      const result = await response.json();
      
      if (result.success && result.assistants.length > 0) {
        // Find Hindi assistant (you can customize this logic)
        const hindiAssistant = result.assistants.find((assistant: any) => 
          assistant.name.toLowerCase().includes('hindi') || 
          assistant.name.toLowerCase().includes('हिंदी')
        ) || result.assistants[0]; // Fallback to first assistant
        
        setAssistantStatus(prev => ({
          ...prev,
          isConfigured: true,
          assistantId: hindiAssistant.id,
          lastTested: new Date().toISOString()
        }));
        
        // Set language to Hindi for UI display
        setAssistantConfig(prev => ({
          ...prev,
          language: "hi",
          name: hindiAssistant.name || "Hindi Assistant"
        }));
        
        alert(`Using VAPI assistant directly! ID: ${hindiAssistant.id}\n\nThis will use your pre-configured assistant from VAPI without modifying the database.`);
      } else {
        alert("No assistants found. Please create one first.");
      }
    } catch (error) {
      console.error("Error loading VAPI assistant:", error);
      alert("Error loading VAPI assistant");
    }
  };

  const saveAssistantConfig = async () => {
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assistantConfig)
      });
      const result = await response.json();
      
      if (result.success) {
        alert("Assistant configuration saved successfully!");
      } else {
        alert(`Failed to save configuration: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving assistant config:", error);
      alert("Error saving assistant configuration");
    }
  };

  // Load call queue and history on component mount
  useEffect(() => {
    loadCallData();
    // Check if Supabase is configured
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    setDataLocation(hasSupabase ? "Supabase Database (Cloud)" : "Local Memory (Fallback)");
  }, []);

  const loadCallData = async () => {
    try {
      setIsLoading(true);
      const [queueResponse, historyResponse, candidatesResponse] = await Promise.all([
        fetch("/api/calls"),
        fetch("/api/calls?type=history"),
        fetch("/api/data?action=candidates")
      ]);
      
      const queueData = await queueResponse.json();
      const historyData = await historyResponse.json();
      const candidatesData = await candidatesResponse.json();
      
      setCallQueue(queueData.queue || []);
      setCallHistory(historyData.calls || []);
      setCandidates(candidatesData.candidates || []);
    } catch (error) {
      console.error("Error loading call data:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-excel", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh candidates from Supabase
        await loadCallData();
        alert(`Successfully parsed and saved ${result.totalCount} candidates from Excel file`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  const addToCallQueue = async () => {
    if (candidates.length === 0) {
      alert("Please upload an Excel file first");
      return;
    }

    try {
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_to_queue",
          candidates: candidates
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setCallQueue(prev => [...prev, ...candidates]);
        alert(`Added ${candidates.length} candidates to call queue`);
        setActiveTab("queue");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error adding to queue:", error);
      alert("Error adding candidates to queue");
    }
  };

  const addSingleCandidateToQueue = async (candidate: Candidate) => {
    try {
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_to_queue",
          candidates: [candidate]
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setCallQueue(prev => [...prev, candidate]);
        alert(`Added ${candidate.name} to call queue`);
        setActiveTab("queue");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error adding candidate to queue:", error);
      alert("Error adding candidate to queue");
    }
  };

  const startCall = async (candidate: Candidate) => {
    setIsCalling(true);
    setCurrentCall(candidate);
    
    try {
      // Update status in queue
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_call",
          candidateId: candidate.id
        }),
      });

      // Use VAPI assistant directly - no custom overrides
      const callResponse = await fetch("/api/vapi-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: candidate.phone,
          candidateName: candidate.name,
          assistantId: assistantStatus.assistantId
          // No customInstructions or voiceSettings - use VAPI assistant as-is
        }),
      });

      const callResult = await callResponse.json();
      
      if (callResult.success) {
        alert(`Call initiated to ${candidate.name} at ${formatPhoneForDisplay(candidate.phone)}`);
        loadCallData(); // Refresh data
      } else {
        alert(`Error initiating call: ${callResult.error}`);
      }
    } catch (error) {
      console.error("Error starting call:", error);
      alert("Error starting call");
    } finally {
      setIsCalling(false);
      setCurrentCall(null);
    }
  };

  const endCall = async (candidate: Candidate, result: string, notes: string) => {
    try {
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end_call",
          candidateId: candidate.id,
          call_result: result,
          call_notes: notes
        }),
      });

      if (response.ok) {
        loadCallData(); // Refresh data
        alert("Call completed and moved to history");
      }
    } catch (error) {
      console.error("Error ending call:", error);
      alert("Error ending call");
    }
  };

  const clearQueue = async () => {
    if (confirm("Are you sure you want to clear the call queue?")) {
      try {
        const response = await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clear_queue" }),
        });

        if (response.ok) {
          setCallQueue([]);
          alert("Call queue cleared");
        }
      } catch (error) {
        console.error("Error clearing queue:", error);
        alert("Error clearing queue");
      }
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch("/api/data?action=export");
      const result = await response.json();
      
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `auto-caller-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        alert("Data exported successfully!");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Error exporting data");
    }
  };

  const clearAllData = async () => {
    if (confirm("Are you sure you want to clear ALL data? This will delete all candidates, call queue, and history. This action cannot be undone!")) {
      try {
        const response = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clear_all" }),
        });

        if (response.ok) {
          setCandidates([]);
          setCallQueue([]);
          setCallHistory([]);
          alert("All data cleared successfully");
        }
      } catch (error) {
        console.error("Error clearing data:", error);
        alert("Error clearing data");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Phone className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Auto Caller Agent</h1>
              </div>
              <Badge variant="outline" className="text-sm">
                {callQueue.length} in queue
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                <span>{dataLocation}</span>
              </div>
              
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                <div className={`w-2 h-2 rounded-full ${
                  assistantConfig.language === "hi" ? 'bg-orange-500' : 'bg-blue-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {assistantConfig.language === "hi" ? "हिंदी" : "English"}
                </span>
              </div>
              
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              
              <Button variant="outline" size="sm" onClick={clearAllData}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Call Configuration</DialogTitle>
                    <DialogDescription>
                      Configure your calling settings and interview script
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                        <div>
                          <h3 className="font-semibold text-green-900">VAPI Assistant Calls</h3>
                          <p className="text-sm text-green-700 mt-1">
                            All calls use your pre-configured VAPI assistant with your Twilio number imported to VAPI.
                          </p>
                          <p className="text-xs text-green-600 mt-2">
                            <strong>Normal calls</strong> - No automated scripts, uses your VAPI configuration directly.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                        <div>
                          <h3 className="font-semibold text-green-900">Using VAPI Assistant</h3>
                          <p className="text-sm text-green-700 mt-1">
                            Your calls will use your pre-configured VAPI assistant. No local script needed.
                          </p>
                          <p className="text-xs text-green-600 mt-2">
                            Configure your assistant in the <strong>Assistant tab</strong> or use your existing VAPI configuration.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "upload" | "assistant" | "candidates" | "queue" | "history")} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Candidates ({candidates.length})</span>
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Call Queue ({callQueue.length})</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>History ({callHistory.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Upload Candidate Data</span>
                </CardTitle>
                <CardDescription>
                  Upload an Excel file with candidate information to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Excel File (.xlsx, .xls)</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 h-14"
                  />
                  {isUploading && (
                    <div className="space-y-2">
                      <Progress value={33} className="w-full" />
                      <p className="text-sm text-muted-foreground">Uploading and parsing file...</p>
                    </div>
                  )}
                </div>


                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Loading candidates...</span>
                    </div>
                  </div>
                ) : candidates.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Parsed Candidates ({candidates.length})</h3>
                      <Button onClick={addToCallQueue} className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Add All to Queue</span>
                      </Button>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Position</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {candidates.slice(0, 10).map((candidate) => (
                            <TableRow key={candidate.id}>
                              <TableCell className="font-medium">{candidate.name}</TableCell>
                              <TableCell>{formatPhoneForDisplay(candidate.phone)}</TableCell>
                              <TableCell>{candidate.email}</TableCell>
                              <TableCell>{candidate.position}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {candidates.length > 10 && (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          ... and {candidates.length - 10} more candidates
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No candidates uploaded yet</p>
                    <p className="text-sm">Upload an Excel file to get started</p>
                  </div>
                )}

              </CardContent>
            </Card>
          </TabsContent>

          {/* Candidates Tab */}
          <TabsContent value="candidates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>All Candidates ({candidates.length})</span>
                </CardTitle>
                <CardDescription>
                  Manage and review all uploaded candidates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {candidates.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No candidates uploaded</h3>
                    <p className="text-muted-foreground mb-4">Upload an Excel file to get started</p>
                    <Button onClick={() => setActiveTab("upload")}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {candidates.map((candidate) => (
                          <TableRow key={candidate.id}>
                            <TableCell className="font-medium">{candidate.name}</TableCell>
                            <TableCell>{formatPhoneForDisplay(candidate.phone)}</TableCell>
                            <TableCell>{candidate.email}</TableCell>
                            <TableCell>{candidate.position}</TableCell>
                            <TableCell>
                              <Badge variant={candidate.status === "completed" ? "default" : "secondary"}>
                                {candidate.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startCall(candidate)}
                                disabled={isCalling || candidate.status === "calling"}
                              >
                                {isCalling && currentCall?.id === candidate.id ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Calling...
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Call Now
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Call Queue Tab */}
          <TabsContent value="queue" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Phone className="h-5 w-5" />
                      <span>Call Queue ({callQueue.length})</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your call queue and start automated calls
                    </CardDescription>
                  </div>
                  {callQueue.length > 0 && (
                    <Button variant="destructive" onClick={clearQueue}>
                      <Square className="h-4 w-4 mr-2" />
                      Clear Queue
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {callQueue.length === 0 ? (
                  <div className="text-center py-12">
                    <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No candidates in queue</h3>
                    <p className="text-muted-foreground mb-4">Add candidates from the upload tab to get started</p>
                    <Button onClick={() => setActiveTab("upload")}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Candidates
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {callQueue.map((candidate) => (
                            <TableRow key={candidate.id}>
                              <TableCell className="font-medium">{candidate.name}</TableCell>
                              <TableCell>{formatPhoneForDisplay(candidate.phone)}</TableCell>
                              <TableCell>{candidate.position}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    candidate.status === "pending" ? "secondary" :
                                    candidate.status === "calling" ? "default" : "outline"
                                  }
                                >
                                  {candidate.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startCall(candidate)}
                                  disabled={isCalling || candidate.status === "calling"}
                                >
                                  {isCalling && currentCall?.id === candidate.id ? (
                                    <>
                                      <Pause className="h-4 w-4 mr-2" />
                                      Calling...
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4 mr-2" />
                                      Start Call
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Call History ({callHistory.length})</span>
                </CardTitle>
                <CardDescription>
                  Review completed calls and their results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {callHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No completed calls yet</h3>
                    <p className="text-muted-foreground">Start making calls to see them here</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Call Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {callHistory.map((candidate) => (
                          <TableRow key={candidate.id}>
                            <TableCell className="font-medium">{candidate.name}</TableCell>
                            <TableCell>{formatPhoneForDisplay(candidate.phone)}</TableCell>
                            <TableCell>{candidate.position}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {candidate.call_result || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {candidate.call_notes || "N/A"}
                            </TableCell>
                            <TableCell>
                              {candidate.call_time ? new Date(candidate.call_time).toLocaleString() : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Assistant Tab */}
          <TabsContent value="assistant" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>VAPI Assistant Configuration</span>
                  {assistantStatus.isConfigured && (
                    <Badge variant="default" className="ml-2">
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Configure your VAPI assistant for intelligent call handling with support for multiple languages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Start Message */}
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Quick Start with VAPI Assistant</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Since you already have a Hindi assistant configured in VAPI, you can use it directly without recreating the configuration here.
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        <strong>Direct Mode:</strong> Your VAPI assistant's script, voice, and settings will be used exactly as configured in VAPI. No local overrides.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assistant Status */}
                <div className={`p-6 border-2 rounded-lg transition-all duration-200 ${
                  assistantStatus.isConfigured 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-orange-200 bg-orange-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        assistantStatus.isConfigured ? 'bg-green-500' : 'bg-orange-500'
                      }`}></div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {assistantStatus.isConfigured ? 'Assistant Active' : 'Assistant Not Configured'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {assistantStatus.isConfigured 
                            ? `Using VAPI Assistant ID: ${assistantStatus.assistantId} (Direct Mode)` 
                            : "Create or load an assistant to get started with intelligent calling"
                          }
                        </p>
                        {assistantStatus.lastTested && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last tested: {new Date(assistantStatus.lastTested).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={testAssistantConnection}
                        className="flex items-center space-x-1"
                      >
                        <Database className="h-3 w-3" />
                        <span>Test</span>
                      </Button>
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={useVapiAssistantDirectly}
                        className="flex items-center space-x-1"
                      >
                        <Phone className="h-3 w-3" />
                        <span>Use VAPI Assistant</span>
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={loadExistingHindiAssistant}
                        className="flex items-center space-x-1"
                      >
                        <Users className="h-3 w-3" />
                        <span>Load Config</span>
                      </Button>
                      <Button 
                        size="sm"
                        onClick={createTestAssistant}
                        className="flex items-center space-x-1"
                      >
                        <Settings className="h-3 w-3" />
                        <span>Create New</span>
                      </Button>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Assistant Configuration Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Settings</h3>
                    
                    <div>
                      <Label htmlFor="assistant-name">Assistant Name</Label>
                      <Input
                        id="assistant-name"
                        value={assistantConfig.name}
                        onChange={(e) => setAssistantConfig(prev => ({
                          ...prev,
                          name: e.target.value
                        }))}
                        placeholder="Interview Assistant"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assistant-language" className="text-base font-medium">Language</Label>
                      <div className="p-4 border rounded-lg bg-blue-50">
                        <Select
                          value={assistantConfig.language}
                          onValueChange={(value) => {
                            setAssistantConfig(prev => {
                              const newConfig = { ...prev, language: value };
                              
                              // Update voice and transcription settings based on language
                              if (value === "hi") {
                                newConfig.voice = {
                                  ...prev.voice,
                                  voiceId: "hindi-male-1" // Hindi voice
                                };
                                newConfig.transcription = {
                                  ...prev.transcription,
                                  language: "hi"
                                };
                                newConfig.instructions = `आप एक पेशेवर साक्षात्कार सहायक हैं जो नौकरी के उम्मीदवारों के लिए फोन साक्षात्कार आयोजित करते हैं।

आपकी भूमिका है:
1. उम्मीदवार का पेशेवर तरीके से स्वागत करना
2. प्रासंगिक साक्षात्कार प्रश्न पूछना
3. उनकी प्रतिक्रियाओं को सक्रिय रूप से सुनना
4. महत्वपूर्ण जानकारी का नोट लेना
5. मित्रवत लेकिन पेशेवर रहना
6. यदि वे मानव से बात करना चाहते हैं, तो समझाएं कि यह एक स्वचालित स्क्रीनिंग है
7. अंत में उनके समय के लिए धन्यवाद देना

हमेशा सम्मानजनक, धैर्यवान और पेशेवर रहें।`;
                              } else {
                                newConfig.voice = {
                                  ...prev.voice,
                                  voiceId: "adam" // English voice
                                };
                                newConfig.transcription = {
                                  ...prev.transcription,
                                  language: "multi"
                                };
                                newConfig.instructions = `You are a professional interview assistant conducting phone interviews for job candidates. 

Your role is to:
1. Greet the candidate professionally
2. Ask relevant interview questions
3. Listen actively to their responses
4. Take notes of key information
5. Be friendly but professional
6. If they ask to speak to a human, explain this is an automated screening
7. Thank them for their time at the end

Always be respectful, patient, and professional.`;
                              }
                              
                              return newConfig;
                            });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">🇺🇸</span>
                                <span>English</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="hi">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">🇮🇳</span>
                                <span>Hindi (हिंदी)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                          {assistantConfig.language === "hi" 
                            ? "Hindi voice and transcription will be automatically configured"
                            : "Multi-language voice and transcription will be used"
                          }
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="model-provider">Model Provider</Label>
                      <Select
                        value={assistantConfig.model.provider}
                        onValueChange={(value) => setAssistantConfig(prev => ({
                          ...prev,
                          model: { ...prev.model, provider: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="model-name">Model</Label>
                      <Select
                        value={assistantConfig.model.model}
                        onValueChange={(value) => setAssistantConfig(prev => ({
                          ...prev,
                          model: { ...prev.model, model: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                          <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Voice Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Voice Settings</h3>
                    
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className={`w-2 h-2 rounded-full ${
                          assistantConfig.language === "hi" ? 'bg-orange-500' : 'bg-blue-500'
                        }`}></div>
                        <span className="text-sm font-medium">
                          {assistantConfig.language === "hi" ? "Hindi Voice Configuration" : "English Voice Configuration"}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="voice-provider">Voice Provider</Label>
                          <Select
                            value={assistantConfig.voice.provider}
                            onValueChange={(value) => setAssistantConfig(prev => ({
                              ...prev,
                              voice: { ...prev.voice, provider: value }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="azure">Azure</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="voice-id">Voice ID</Label>
                          <Input
                            id="voice-id"
                            value={assistantConfig.voice.voiceId}
                            onChange={(e) => setAssistantConfig(prev => ({
                              ...prev,
                              voice: { ...prev.voice, voiceId: e.target.value }
                            }))}
                            placeholder={assistantConfig.language === "hi" ? "hindi-male-1" : "adam"}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {assistantConfig.language === "hi" 
                              ? "Recommended: hindi-male-1, hindi-female-1, or your custom Hindi voice"
                              : "Recommended: adam, sarah, or your custom English voice"
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Voice Speed: {assistantConfig.voice.speed}</Label>
                      <Slider
                        value={[assistantConfig.voice.speed]}
                        onValueChange={([value]) => setAssistantConfig(prev => ({
                          ...prev,
                          voice: { ...prev.voice, speed: value }
                        }))}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Voice Pitch: {assistantConfig.voice.pitch}</Label>
                      <Slider
                        value={[assistantConfig.voice.pitch]}
                        onValueChange={([value]) => setAssistantConfig(prev => ({
                          ...prev,
                          voice: { ...prev.voice, pitch: value }
                        }))}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="instructions" className="text-base font-medium">Assistant Instructions</Label>
                    <Badge variant="outline" className="text-xs">
                      {assistantConfig.language === "hi" ? "Hindi Mode" : "English Mode"}
                    </Badge>
                  </div>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <Textarea
                      id="instructions"
                      value={assistantConfig.instructions}
                      onChange={(e) => setAssistantConfig(prev => ({
                        ...prev,
                        instructions: e.target.value
                      }))}
                      placeholder={assistantConfig.language === "hi" 
                        ? "आपके सहायक के लिए विस्तृत निर्देश दर्ज करें..."
                        : "Enter detailed instructions for your assistant..."
                      }
                      className="min-h-[200px] bg-white"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {assistantConfig.language === "hi" 
                          ? "Hindi instructions will be used for all calls"
                          : "English instructions will be used for all calls"
                        }
                      </span>
                      <span>{assistantConfig.instructions.length} characters</span>
                    </div>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="max-duration">Max Duration (seconds)</Label>
                    <Input
                      id="max-duration"
                      type="number"
                      value={assistantConfig.maxDurationSeconds}
                      onChange={(e) => setAssistantConfig(prev => ({
                        ...prev,
                        maxDurationSeconds: parseInt(e.target.value) || 600
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="silence-timeout">Silence Timeout (seconds)</Label>
                    <Input
                      id="silence-timeout"
                      type="number"
                      value={assistantConfig.silenceTimeoutSeconds}
                      onChange={(e) => setAssistantConfig(prev => ({
                        ...prev,
                        silenceTimeoutSeconds: parseInt(e.target.value) || 5
                      }))}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      assistantStatus.isConfigured ? 'bg-green-500' : 'bg-orange-500'
                    }`}></div>
                    <span className="text-sm text-muted-foreground">
                      {assistantStatus.isConfigured 
                        ? "Assistant is ready for calls"
                        : "Configure assistant to enable calling"
                      }
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={loadAssistantConfig}
                      className="flex items-center space-x-1"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Load Config</span>
                    </Button>
                    <Button 
                      onClick={saveAssistantConfig}
                      className="flex items-center space-x-1"
                    >
                      <Save className="h-3 w-3" />
                      <span>Save Config</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
