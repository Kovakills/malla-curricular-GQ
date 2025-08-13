"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, CheckCircle, Clock, Lock, GraduationCap } from "lucide-react"
import { curriculumData, type Subject, type SubjectStatus } from "@/lib/curriculum-data"

export default function MallaCurricularPage() {
  const [subjectStatuses, setSubjectStatuses] = useState<Record<string, SubjectStatus>>({})
  const [selectedSemester, setSelectedSemester] = useState<number>(1)

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("curriculum-progress")
    if (saved) {
      setSubjectStatuses(JSON.parse(saved))
    }
  }, [])

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem("curriculum-progress", JSON.stringify(subjectStatuses))
  }, [subjectStatuses])

  const updateSubjectStatus = (subjectCode: string, status: SubjectStatus) => {
    setSubjectStatuses((prev) => ({
      ...prev,
      [subjectCode]: status,
    }))
  }

  const isSubjectAvailable = (subject: Subject): boolean => {
    if (!subject.prerequisites || subject.prerequisites.length === 0) return true

    return subject.prerequisites.every((prereq) => {
      if (prereq === "Nivel IV" || prereq === "Nivel VIII") {
        // Check if all subjects from that level are approved
        const levelNumber = prereq === "Nivel IV" ? 4 : 8
        const levelSubjects = curriculumData.semesters[levelNumber - 1]?.subjects || []
        return levelSubjects.every((s) => subjectStatuses[s.code] === "approved")
      }
      return subjectStatuses[prereq] === "approved"
    })
  }

  const getSubjectStatus = (subject: Subject): SubjectStatus => {
    const status = subjectStatuses[subject.code]
    if (status) return status
    return isSubjectAvailable(subject) ? "available" : "locked"
  }

  const calculateProgress = () => {
    const totalSubjects = curriculumData.semesters.reduce((acc, sem) => acc + sem.subjects.length, 0)
    const approvedSubjects = Object.values(subjectStatuses).filter((status) => status === "approved").length
    return Math.round((approvedSubjects / totalSubjects) * 100)
  }

  const getStatusIcon = (status: SubjectStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "current":
        return <Clock className="w-4 h-4 text-blue-600" />
      case "available":
        return <BookOpen className="w-4 h-4 text-gray-600" />
      case "locked":
        return <Lock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: SubjectStatus) => {
    switch (status) {
      case "approved":
        return "bg-green-100 border-green-300 text-green-800"
      case "current":
        return "bg-blue-100 border-blue-300 text-blue-800"
      case "available":
        return "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"
      case "locked":
        return "bg-gray-50 border-gray-200 text-gray-400"
    }
  }

  const progress = calculateProgress()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Microbiología y Bioanálisis</h1>
              <p className="text-gray-600">Tu ruta académica personalizada</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso Académico</span>
              <span className="text-sm font-bold text-blue-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {Object.values(subjectStatuses).filter((s) => s === "approved").length} de{" "}
              {curriculumData.semesters.reduce((acc, sem) => acc + sem.subjects.length, 0)} materias aprobadas
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs
          value={selectedSemester.toString()}
          onValueChange={(value) => setSelectedSemester(Number.parseInt(value))}
        >
          <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-1 h-auto p-1 mb-6">
            {curriculumData.semesters.map((semester) => (
              <TabsTrigger key={semester.level} value={semester.level.toString()} className="text-xs px-2 py-2">
                Sem {semester.level}
              </TabsTrigger>
            ))}
          </TabsList>

          {curriculumData.semesters.map((semester) => (
            <TabsContent key={semester.level} value={semester.level.toString()}>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Semestre {semester.level}</h2>
                <p className="text-gray-600 text-sm">
                  {semester.subjects.length} materias • {semester.subjects.reduce((acc, s) => acc + s.credits, 0)}{" "}
                  créditos
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {semester.subjects.map((subject) => {
                  const status = getSubjectStatus(subject)
                  return (
                    <Card
                      key={subject.code}
                      className={`transition-all duration-200 ${getStatusColor(status)} ${
                        status !== "locked" ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (status !== "locked") {
                          const nextStatus =
                            status === "available" ? "current" : status === "current" ? "approved" : "available"
                          updateSubjectStatus(subject.code, nextStatus)
                        }
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-semibold leading-tight mb-1">{subject.name}</CardTitle>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{subject.credits} créditos</span>
                              {subject.type === "Electiva" && (
                                <Badge variant="outline" className="text-xs">
                                  Electiva
                                </Badge>
                              )}
                            </div>
                          </div>
                          {getStatusIcon(status)}
                        </div>
                      </CardHeader>

                      {subject.prerequisites && subject.prerequisites.length > 0 && (
                        <CardContent className="pt-0">
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Prerrequisitos:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {subject.prerequisites.map((prereq, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {prereq}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Legend */}
        <div className="mt-8 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Leyenda</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Aprobada</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Cursando</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-600" />
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <span>Bloqueada</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
