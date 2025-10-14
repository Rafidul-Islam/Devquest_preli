"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ExamReport } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Bot, CheckCircle, FileText, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function ReportSkeleton() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/4" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<ExamReport | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const reportData = localStorage.getItem('examReport');
    if (reportData) {
      setReport(JSON.parse(reportData));
      localStorage.removeItem('examReport');
    } else {
      router.replace('/');
    }
  }, [router]);

  if (!isClient || !report) {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <ReportSkeleton />
          </div>
        </main>
      </>
    );
  }

  const { score, totalQuestions, proctoringResult, answeredQuestions } = report;
  const scorePercentage = (score / totalQuestions) * 100;

  const suspicionLevelStyles = {
    LOW: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
    HIGH: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
  };

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Exam Report</h1>
            <p className="text-muted-foreground">Here is a summary of your performance and proctoring analysis.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-6xl font-bold">{score}/{totalQuestions}</p>
                <p className="text-muted-foreground">({scorePercentage.toFixed(1)}%)</p>
              </div>
              <Progress value={scorePercentage} className="mt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot /> AI Proctoring Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <p className="font-semibold">Overall Suspicion Level</p>
                <Badge className={cn('text-base', suspicionLevelStyles[proctoringResult.overallSuspicionLevel])}>
                  {proctoringResult.overallSuspicionLevel}
                </Badge>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground p-4 bg-secondary rounded-md">{proctoringResult.summary}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Flags Raised</h3>
                {proctoringResult.flags.length > 0 ? (
                  <ul className="space-y-2">
                    {proctoringResult.flags.map((flag, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No suspicious activity was flagged.</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
             <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText /> Answer Review
              </CardTitle>
              <CardDescription>Review each question and your answer.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {answeredQuestions.map(({ question, selectedAnswer, isCorrect }, index) => (
                        <AccordionItem value={`item-${index}`} key={question.id}>
                            <AccordionTrigger className={cn("text-left", isCorrect ? 'text-foreground' : 'text-destructive')}>
                                <div className="flex items-center gap-2">
                                    {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                                    <span>Question {index + 1}: {isCorrect ? 'Correct' : 'Incorrect'}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <p className="font-semibold">{question.question}</p>
                                <ul className="space-y-2 text-sm">
                                    {question.options.map((option, optIndex) => (
                                        <li key={optIndex} className={cn(
                                            "flex items-center gap-2 border p-2 rounded-md",
                                            optIndex === question.correctAnswer ? 'border-green-500 bg-green-500/10' : '',
                                            optIndex === selectedAnswer && !isCorrect ? 'border-destructive bg-red-500/10' : ''
                                        )}>
                                            {optIndex === question.correctAnswer && <CheckCircle className="h-4 w-4 text-green-500" />}
                                            {optIndex === selectedAnswer && optIndex !== question.correctAnswer && <XCircle className="h-4 w-4 text-destructive" />}
                                            <span>{option}</span>
                                            {optIndex === selectedAnswer && <Badge variant="outline">Your Answer</Badge>}
                                            {optIndex === question.correctAnswer && <Badge variant="outline" className="border-green-500 text-green-600">Correct Answer</Badge>}
                                        </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
          </Card>

          <div className="text-center pt-4">
             <Button asChild size="lg">
                <Link href="/">Take Another Exam</Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
