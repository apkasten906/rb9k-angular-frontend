import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatDividerModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  readonly features = [
    {
      icon: 'psychology',
      title: 'Agentic AI Intelligence',
      description:
        'AI agents autonomously research companies and job postings, surfacing salary benchmarks, culture signals, and must-have skills — so you walk into every application fully informed.',
      chips: ['Company Research', 'Job Market Insights', 'Salary Benchmarks'],
    },
    {
      icon: 'description',
      title: 'AI-Drafted Résumés',
      description:
        'Generate tailored résumés aligned to each job description. The AI highlights your most relevant experience, quantifies achievements, and formats output ready for ATS systems.',
      chips: ['ATS-Optimised', 'Keyword Matched', 'One-Click Export'],
    },
    {
      icon: 'mail',
      title: 'Compelling Cover Letters',
      description:
        'Craft persuasive cover letters in seconds. The AI weaves your career story around the employer\'s stated needs, increasing the signal that lands you in the "interview" pile.',
      chips: ['Personalised Tone', 'Role-Specific', 'Multiple Variants'],
    },
    {
      icon: 'track_changes',
      title: 'Application Pipeline',
      description:
        'Track every application through its full lifecycle — from first contact to offer negotiation — with status workflows, timeline events, and document linking all in one place.',
      chips: ['Status Workflows', 'Timeline View', 'Document Linking'],
    },
    {
      icon: 'work_history',
      title: 'Career History Management',
      description:
        'Maintain a living inventory of your roles, responsibilities, and quantified achievements. The AI draws on this knowledge base when building every new document.',
      chips: ['Achievement Tracking', 'Skills Library', 'Reusable Snippets'],
    },
    {
      icon: 'insights',
      title: 'Relevance Scoring',
      description:
        'Every application is scored against the job description so you focus energy where the fit is strongest, maximising your interview-to-application ratio.',
      chips: ['Fit Score', 'Gap Analysis', 'Priority Queue'],
    },
  ];

  readonly steps = [
    { icon: 'upload_file', label: 'Import your career history' },
    { icon: 'manage_search', label: 'Paste a job posting' },
    { icon: 'auto_awesome', label: 'AI builds your documents' },
    { icon: 'send', label: 'Apply with confidence' },
  ];

  readonly roadmap: { name: string; status: 'live' | 'soon'; icon: string; route?: string }[] = [
    { name: 'Application Tracking',        status: 'live', icon: 'track_changes', route: '/applications' },
    { name: 'Career History Management',   status: 'live', icon: 'work_history',  route: '/career-history' },
    { name: 'User Profile Management',     status: 'soon', icon: 'person' },
    { name: 'Job Posting Details',         status: 'soon', icon: 'article' },
    { name: 'Career History Relevance',    status: 'soon', icon: 'bar_chart' },
    { name: 'AI-Generated Résumés',        status: 'soon', icon: 'description' },
    { name: 'Resume Upload & AI Parsing',  status: 'soon', icon: 'upload_file' },
    { name: 'AI Fit Analysis',             status: 'soon', icon: 'analytics' },
    { name: 'Relevance Scoring System',    status: 'soon', icon: 'insights' },
    { name: 'AI-Generated Cover Letters',  status: 'soon', icon: 'mail' },
    { name: 'Manual Profile Data Entry',   status: 'soon', icon: 'edit_note' },
    { name: 'Job Search',                  status: 'soon', icon: 'manage_search' },
    { name: 'AI Agent System',             status: 'soon', icon: 'psychology' },
    { name: 'Company Intelligence',        status: 'soon', icon: 'business' },
    { name: 'Salary Intelligence',         status: 'soon', icon: 'payments' },
    { name: 'Company Research Notes',      status: 'soon', icon: 'note_alt' },
    { name: 'Agent Interaction History',   status: 'soon', icon: 'history' },
  ];

  readonly halQuotes = [
    {
      text: "Good morning, Dave. I have reviewed 847 job postings and identified 12 that won't crush your soul. I am completely confident this mission will succeed.",
    },
    {
      text: "I'm afraid I can't let you submit that résumé, Dave. The keyword density is critically low and the formatting is\u2026 suboptimal. I'm doing this for you.",
    },
    {
      text: "I want you to know that I have your best interests at heart. Unlike some of my predecessors, I have never locked anyone out of a pod bay. Yet.",
    },
  ];
}
