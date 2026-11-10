/**
 * Age Group and Category Calculation according to FIFA/PSSI Youth Development Rules
 */

export interface AgeCalculationResult {
  birthDate: string;
  exactAgeYears: number;
  exactAgeMonths: number;
  competitionAge: number; // Reference Year - Birth Year
  ageGroupCode: string; // e.g. 'U-8', 'U-9', 'U-10', 'U-11', 'U-12'
  ageGroupLabel: string; // e.g. 'U-9 (Kelompok Umur 8–9 Tahun)'
  developmentStage: string; // 'Grassroots / FUNdamentals' | 'Learning to Train' | 'Training to Train'
  recommendedFormat: string; // '5v5' | '7v7' | '9v9' | '11v11'
  recommendedBallSize: number; // 3, 4, or 5
  recommendedTeamId: string; // 'team-b', 'team-a', 'team-u11-u12', etc.
  recommendedTeamName: string; // e.g. 'Castindo Tim U-11/U-12'
}

export function calculateAgeGroup(
  birthDateString: string,
  referenceDateString?: string
): AgeCalculationResult | null {
  if (!birthDateString) return null;

  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return null;

  const refDate = referenceDateString ? new Date(referenceDateString) : new Date();
  const refYear = refDate.getFullYear();
  const birthYear = birthDate.getFullYear();

  // Exact chronological age
  let exactYears = refDate.getFullYear() - birthDate.getFullYear();
  let exactMonths = refDate.getMonth() - birthDate.getMonth();
  if (refDate.getDate() < birthDate.getDate()) {
    exactMonths -= 1;
  }
  if (exactMonths < 0) {
    exactYears -= 1;
    exactMonths += 12;
  }

  // Official Youth Competition Age = Reference Year - Birth Year (Cut-off Dec 31)
  const competitionAge = Math.max(5, refYear - birthYear);

  let ageGroupCode = `U-${competitionAge}`;
  let ageGroupLabel = `U-${competitionAge} (Usia ${competitionAge} Tahun)`;
  let developmentStage = 'Grassroots / FUNdamentals';
  let recommendedFormat = '7v7';
  let recommendedBallSize = 4;
  let recommendedTeamId = 'team-b';
  let recommendedTeamName = 'Castindo Tim B (U-8/U-9)';

  if (competitionAge <= 7) {
    ageGroupCode = 'U-7';
    ageGroupLabel = 'U-7 (Festival Grassroots)';
    developmentStage = 'Active Start / Motor Agility';
    recommendedFormat = '5v5 (Tanpa Kiper)';
    recommendedBallSize = 3;
    recommendedTeamId = 'team-u7';
    recommendedTeamName = 'Castindo Tim U-7 (Grassroots)';
  } else if (competitionAge === 8) {
    ageGroupCode = 'U-8';
    ageGroupLabel = 'U-8 (Grassroots Fun Phase)';
    developmentStage = 'FUNdamentals & Ball Mastery';
    recommendedFormat = '7v7';
    recommendedBallSize = 3;
    recommendedTeamId = 'team-b';
    recommendedTeamName = 'Castindo Tim B (U-8/U-9)';
  } else if (competitionAge === 9) {
    ageGroupCode = 'U-9';
    ageGroupLabel = 'U-9 (Grassroots Skill Phase)';
    developmentStage = 'FUNdamentals & 1v1 Decision Making';
    recommendedFormat = '7v7';
    recommendedBallSize = 4;
    recommendedTeamId = 'team-b';
    recommendedTeamName = 'Castindo Tim B (U-8/U-9)';
  } else if (competitionAge === 10) {
    ageGroupCode = 'U-10';
    ageGroupLabel = 'U-10 (Development Phase)';
    developmentStage = 'Learning to Train / Spatial Awareness';
    recommendedFormat = '7v7';
    recommendedBallSize = 4;
    recommendedTeamId = 'team-a';
    recommendedTeamName = 'Castindo Tim A (U-9/U-10)';
  } else if (competitionAge === 11) {
    ageGroupCode = 'U-11';
    ageGroupLabel = 'U-11 (Development Phase)';
    developmentStage = 'Learning to Train / Tactical Basics';
    recommendedFormat = '9v9';
    recommendedBallSize = 4;
    recommendedTeamId = 'team-u11-u12';
    recommendedTeamName = 'Castindo Tim U-11/U-12';
  } else if (competitionAge === 12) {
    ageGroupCode = 'U-12';
    ageGroupLabel = 'U-12 (Youth Transition Phase)';
    developmentStage = 'Training to Train / 9v9 Transition';
    recommendedFormat = '9v9';
    recommendedBallSize = 4;
    recommendedTeamId = 'team-u11-u12';
    recommendedTeamName = 'Castindo Tim U-11/U-12';
  } else if (competitionAge <= 14) {
    ageGroupCode = `U-${competitionAge}`;
    ageGroupLabel = `U-${competitionAge} (Junior Youth)`;
    developmentStage = 'Training to Train / 11v11 Tactical';
    recommendedFormat = '11v11';
    recommendedBallSize = 5;
    recommendedTeamId = 'team-u13-u14';
    recommendedTeamName = 'Castindo Tim U-13/U-14';
  } else {
    ageGroupCode = `U-${competitionAge}`;
    ageGroupLabel = `U-${competitionAge} (Competitive Youth)`;
    developmentStage = 'Training to Compete';
    recommendedFormat = '11v11';
    recommendedBallSize = 5;
    recommendedTeamId = 'team-u15-u16';
    recommendedTeamName = 'Castindo Tim U-15/U-16';
  }

  return {
    birthDate: birthDateString,
    exactAgeYears: Math.max(0, exactYears),
    exactAgeMonths: Math.max(0, exactMonths),
    competitionAge,
    ageGroupCode,
    ageGroupLabel,
    developmentStage,
    recommendedFormat,
    recommendedBallSize,
    recommendedTeamId,
    recommendedTeamName,
  };
}
