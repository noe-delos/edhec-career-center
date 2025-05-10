/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */

"use client";

// components/interview-selection.tsx

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, ChevronRight } from "lucide-react";

interface InterviewSelectionProps {
  onStart: (interviewType: string) => void;
}

export function InterviewSelection({ onStart }: InterviewSelectionProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* En-tête amélioré avec l'identité EDHEC */}
      <header className="py-6 px-4 border-b">
        <div className="container max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between">
          <img
            src="https://upload.wikimedia.org/wikipedia/fr/thumb/5/53/Logo_EDHEC_Business_School.svg/2560px-Logo_EDHEC_Business_School.svg.png"
            alt="Logo EDHEC"
            width={180}
            height={60}
            className="mb-4 sm:mb-0"
          />
          <h1 className="text-2xl font-bold">Préparation aux Entretiens</h1>
        </div>
      </header>

      {/* Contenu principal - centré comme dans le composant conversation */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* Carte Entretien Finance d'Entreprise */}
          <Card className="w-full hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md">
            <CardHeader
              className="flex flex-row items-center gap-4 pb-2"
              style={{ color: "#A02235" }}
            >
              <div className="p-2 rounded-full bg-red-50">
                <Building2 size={28} style={{ color: "#A02235" }} />
              </div>
              <CardTitle className="text-xl">Finance d'Entreprise</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center space-x-2 mb-1">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                <p className="text-gray-600 text-sm">Valorisation & DCF</p>
              </div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                <p className="text-gray-600 text-sm">Fusions & LBO</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                <p className="text-gray-600 text-sm">Comptabilité & Finance</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full rounded-full flex items-center justify-between"
                style={{ backgroundColor: "#A02235" }}
                onClick={() => onStart("corporate")}
              >
                <span>Démarrer</span>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>

          {/* Carte Entretien Marchés */}
          <Card className="w-full hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md">
            <CardHeader
              className="flex flex-row items-center gap-4 pb-2"
              style={{ color: "#A02235" }}
            >
              <div className="p-2 rounded-full bg-red-50">
                <TrendingUp size={28} style={{ color: "#A02235" }} />
              </div>
              <CardTitle className="text-xl">Sales & Trading</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center space-x-2 mb-1">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                <p className="text-gray-600 text-sm">Analyse de Marché</p>
              </div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                <p className="text-gray-600 text-sm">
                  Stratégies d'Investissement
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                <p className="text-gray-600 text-sm">Trading & Couverture</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full rounded-full flex items-center justify-between"
                style={{ backgroundColor: "#A02235" }}
                onClick={() => onStart("market")}
              >
                <span>Démarrer</span>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Pied de page avec information minimale */}
      <footer className="py-4 text-center text-gray-500 text-sm">
        <p>EDHEC Préparation aux Entretiens</p>
      </footer>
    </div>
  );
}
