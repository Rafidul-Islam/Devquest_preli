"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { examQuestions } from '@/lib/questions';
import type { Question, ExamReport } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getProctoringAnalysis } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, ArrowLeft, ArrowRight, Camera } from 'lucide-react';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { cn } from '@/lib/utils';
import Draggable from 'react-draggable';

type ExamState = 'idle' | 'permission' | 'active' | 'submitting' | 'error';

export default function ExamPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [examState, setExamState] = useState<ExamState>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(examQuestions.length).fill(null));
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { status, startRecording, stopRecording, error: recorderError } = useMediaRecorder();
  
  useEffect(() => {
    // Cleanup function to stop camera on component unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (recorderError) {
      setExamState('error');
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: recorderError.message,
      });
    }
  }, [recorderError, toast]);

  const handleStartExam = async () => {
    setExamState('permission');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      streamRef.current = stream;
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      startRecording(stream);
      setExamState('active');

    } catch (err) {
      console.error("Camera access error:", err);
      setExamState('error');
      setHasCameraPermission(false);
      toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'You must grant camera and microphone access to start the exam. Please enable permissions and try again.',
      });
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    setExamState('submitting');
        
    const videoDataUri = await stopRecording();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }

    if (!videoDataUri && hasCameraPermission) {
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Could not retrieve the exam recording. Submission failed.",
      });
      setExamState('active');
      return;
    }

    const finalVideoDataUri = hasCameraPermission ? videoDataUri || '' : '';
    const proctoringResult = await getProctoringAnalysis(finalVideoDataUri);
    
    let score = 0;
    const answeredQuestions = examQuestions.map((q, index) => {
      const isCorrect = answers[index] === q.correctAnswer;
      if (isCorrect) score++;
      return {
        question: q,
        selectedAnswer: answers[index],
        isCorrect,
      };
    });

    const report: ExamReport = {
      score,
      totalQuestions: examQuestions.length,
      proctoringResult,
      answeredQuestions,
    };
    
    localStorage.setItem('examReport', JSON.stringify(report));
    router.push('/report');
  };
  
  const currentQuestion = examQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / examQuestions.length) * 100;

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Draggable>
          <div className="fixed top-20 right-4 z-10 cursor-move">
            <Card className="w-32 shadow-lg">
              <CardHeader className="p-2 flex-row items-center gap-2">
                <Video className={cn("h-4 w-4", status === 'recording' ? 'text-destructive animate-pulse' : 'text-muted-foreground')} />
                <CardTitle className="text-sm">
                  {status === 'recording' ? 'Recording...' : 'Camera'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 relative">
                 <video ref={videoRef} className="w-full h-auto rounded-b-lg" autoPlay playsInline muted />
                 {examState === 'permission' && !hasCameraPermission && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Loader2 className="h-6 w-6 animate-spin"/>
                  </div>
                 )}
                 {examState !== 'active' && examState !== 'permission' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                 )}
              </CardContent>
            </Card>
          </div>
        </Draggable>


        <div className="max-w-4xl mx-auto">
          {examState === 'idle' || examState === 'error' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Exam Instructions</CardTitle>
                <CardDescription>Please read the instructions carefully before starting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>This is a proctored exam. Your session will be recorded via your webcam and audio.</p>
                <p>Ensure you are in a quiet, well-lit room with no one else present.</p>
                <Alert variant={examState === 'error' ? 'destructive' : 'default'}>
                  <Camera className="h-4 w-4" />
                  <AlertTitle>Camera & Mic Access Required</AlertTitle>
                  <AlertDescription>
                    We will need to access your camera and microphone to proctor the exam. Please grant permission when prompted to start. If you deny permission, the exam cannot proceed.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button size="lg" onClick={handleStartExam}>
                  {examState === 'error' ? 'Retry Camera Access' : 'Start Exam'}
                </Button>
              </CardFooter>
            </Card>
          ) : null}

          {examState === 'permission' && (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg">
                  Requesting camera access... Please allow access in the browser prompt.
                </p>
            </div>
          )}
          
          {examState === 'submitting' && (
             <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg">Submitting and analyzing...</p>
            </div>
          )}

          {examState === 'active' && (
            <div>
              <Progress value={progress} className="mb-4" />
              <Card className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-headline">Question {currentQuestionIndex + 1} of {examQuestions.length}</CardTitle>
                  <CardDescription className="text-lg pt-2">{currentQuestion.question}</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={answers[currentQuestionIndex]?.toString()} onValueChange={(val) => handleAnswerSelect(parseInt(val))}>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 rounded-md hover:bg-secondary transition-colors">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="text-base flex-1 cursor-pointer">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                    <ArrowLeft className="mr-2" /> Previous
                  </Button>
                  {currentQuestionIndex < examQuestions.length - 1 ? (
                    <Button onClick={handleNext}>
                      Next <ArrowRight className="ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} variant="destructive">Submit Exam</Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
