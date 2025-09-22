"use client";

import { useState, useEffect } from "react";
import { Upload, Phone, Users, History, Settings, Play, Pause, Square, FileText, Download } from "lucide-react";
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
  callResult?: string;
  callNotes?: string;
  callTime?: string;
}

interface CallConfiguration {
  method: "vapi" | "twilio" | "hybrid";
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
  const [isUploading, setIsUploading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [currentCall, setCurrentCall] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [callConfig, setCallConfig] = useState<CallConfiguration>({
    method: "hybrid",
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

  // Load call queue and history on component mount
  useEffect(() => {
    loadCallData();
  }, []);

  const loadCallData = async () => {
    try {
      const [queueResponse, historyResponse] = await Promise.all([
        fetch("/api/calls"),
        fetch("/api/calls?type=history")
      ]);
      
      const queueData = await queueResponse.json();
      const historyData = await historyResponse.json();
      
      setCallQueue(queueData.queue || []);
      setCallHistory(historyData.calls || []);
    } catch (error) {
      console.error("Error loading call data:", error);
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
        setCandidates(result.candidates);
        alert(`Successfully parsed ${result.totalCount} candidates from Excel file`);
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

      // Initiate call based on selected method
      let callResponse;
      if (callConfig.method === "twilio") {
        callResponse = await fetch("/api/twilio-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: candidate.phone,
            candidateName: candidate.name,
          }),
        });
      } else if (callConfig.method === "hybrid") {
        callResponse = await fetch("/api/hybrid-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: candidate.phone,
            candidateName: candidate.name,
          }),
        });
      } else {
        // Default to Vapi
        callResponse = await fetch("/api/vapi-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: candidate.phone,
            candidateName: candidate.name,
          }),
        });
      }

      const callResult = await callResponse.json();
      
      if (callResult.success) {
        alert(`Call initiated to ${candidate.name} at ${candidate.phone}`);
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
          callResult: result,
          callNotes: notes
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
                    <div className="space-y-2">
                      <Label>Call Method</Label>
                      <Select 
                        value={callConfig.method} 
                        onValueChange={(value: "vapi" | "twilio" | "hybrid") => 
                          setCallConfig(prev => ({ ...prev, method: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vapi">Vapi Only</SelectItem>
                          <SelectItem value="twilio">Twilio Only</SelectItem>
                          <SelectItem value="hybrid">Twilio + Vapi (Recommended)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Interview Script</Label>
                      <Textarea
                        value={callConfig.script}
                        onChange={(e) => setCallConfig(prev => ({ ...prev, script: e.target.value }))}
                        rows={8}
                        placeholder="Enter your interview script..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Voice Speed</Label>
                        <Slider
                          value={[callConfig.voiceSettings.speed]}
                          onValueChange={([value]) => 
                            setCallConfig(prev => ({ 
                              ...prev, 
                              voiceSettings: { ...prev.voiceSettings, speed: value }
                            }))
                          }
                          min={0.5}
                          max={2.0}
                          step={0.1}
                        />
                        <div className="text-sm text-muted-foreground text-center">
                          {callConfig.voiceSettings.speed}x
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Max Call Duration (minutes)</Label>
                        <Slider
                          value={[callConfig.callSettings.maxDuration]}
                          onValueChange={([value]) => 
                            setCallConfig(prev => ({ 
                              ...prev, 
                              callSettings: { ...prev.callSettings, maxDuration: value }
                            }))
                          }
                          min={5}
                          max={30}
                          step={1}
                        />
                        <div className="text-sm text-muted-foreground text-center">
                          {callConfig.callSettings.maxDuration} min
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
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
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {isUploading && (
                    <div className="space-y-2">
                      <Progress value={33} className="w-full" />
                      <p className="text-sm text-muted-foreground">Uploading and parsing file...</p>
                    </div>
                  )}
                </div>

                {candidates.length > 0 && (
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
                              <TableCell>{candidate.phone}</TableCell>
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
                )}

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Excel File Format:</strong> Your file should contain columns: <code>name</code>, <code>phone</code>, <code>email</code>, <code>position</code>. 
                    The phone column is required, others are optional.
                  </AlertDescription>
                </Alert>
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
                            <TableCell>{candidate.phone}</TableCell>
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
                              <TableCell>{candidate.phone}</TableCell>
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
                            <TableCell>{candidate.phone}</TableCell>
                            <TableCell>{candidate.position}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {candidate.callResult || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {candidate.callNotes || "N/A"}
                            </TableCell>
                            <TableCell>
                              {candidate.callTime ? new Date(candidate.callTime).toLocaleString() : "N/A"}
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
        </Tabs>
      </div>
    </div>
  );
}
