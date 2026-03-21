import { Component } from '@angular/core';
import { CardComponent } from '../../components/card/card.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDotCircle } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tech-depth',
  imports: [CardComponent, FaIconComponent, CommonModule],
  templateUrl: './tech-depth.component.html',
  styleUrl: './tech-depth.component.css',
})
export class TechDepthComponent {

  dotIcon = faDotCircle

  cardsInfo = [
    {
      name: "frontend",
      data: `React (Server Components, Render Optimization)
TypeScript (Strict Mode, Advanced Generics)
Next.js / Vite (SSR, ISR, Edge Runtime)
State Management (Zustand, Jotai, XState)
Micro-Frontends (Module Federation)
Performance (CWV, Bundle Analysis, Tree-shaking)`
    },
    {
      name: "backend",
      data: `Node.js (Express, Fastify, NestJS)
Python (FastAPI, Django REST)
PostgreSQL (Query Optimization, Indexing)
Redis (Caching Strategies, Pub/Sub)
GraphQL (Federation, DataLoader, Subscriptions)
REST API Design (OpenAPI, Versioning)`
    },
    {
      name: "System Design",
      data: `Distributed Systems & CAP Theorem
Event-Driven Architecture (Kafka, RabbitMQ)
CQRS / Event Sourcing Patterns
Load Balancing & CDN Strategy
Observability (Datadog, Grafana, OTel)
CI/CD Pipeline Design (GitHub Actions)`
    },
    {
      name: "DevOps",
      data: `LLM Integration (OpenAI, Anthropic APIs)
RAG Pipelines (Pinecone, Weaviate)
Prompt Engineering & Evaluation
Docker / Kubernetes (Helm, ArgoCD)
Terraform / Infrastructure as Code
Git Workflows (Monorepo, Trunk-Based)`
    }
  ]

}
