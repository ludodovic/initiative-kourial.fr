import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService, Dungeon } from '../../services/api.service';

interface SelectedDungeon {
  dungeon: Dungeon;
  weight: number;
}

interface WheelSegment {
  dungeon: Dungeon;
  weight: number;
  startAngle: number;
  endAngle: number;
  color: string;
}

@Component({
  selector: 'app-dungeon-wheel',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dungeon-wheel.component.html',
  styleUrl: './dungeon-wheel.component.css'
})
export class DungeonWheelComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);

  // State
  readonly allDungeons = signal<Dungeon[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly selectedDungeonForInput = signal<Dungeon | null>(null);
  readonly weightInput = signal('');
  readonly selectedDungeons = signal<SelectedDungeon[]>([]);
  readonly isSpinning = signal(false);
  readonly rotation = signal(0);
  readonly finalSelectedDungeon = signal<SelectedDungeon | null>(null);
  readonly dropdownOpen = signal(false);

  // Computed
  readonly filteredDungeons = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const dungeons = this.allDungeons();
    
    if (!query) return dungeons;
    
    return dungeons.filter(d => 
      d.name.toLowerCase().includes(query)
    );
  });

  readonly wheelSegments = computed(() => {
    const selected = this.selectedDungeons();
    if (selected.length === 0) return [];
    
    const totalWeight = selected.reduce((sum, sd) => sum + sd.weight, 0);
    if (totalWeight === 0) return [];
    
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B', '#FB5607',
      '#8338EC', '#3A86FF', '#FF006E', '#A5DD9B', '#F9C74F'
    ];
    
    let currentAngle = 0;
    const segments: WheelSegment[] = [];
    
    for (const sd of selected) {
      const proportion = sd.weight / totalWeight;
      const angle = proportion * 360;
      
      segments.push({
        dungeon: sd.dungeon,
        weight: sd.weight,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color: colors[segments.length % colors.length]
      });
      
      currentAngle += angle;
    }
    
    return segments;
  });

  readonly canSpin = computed(() => {
    return this.selectedDungeons().length > 0 && !this.isSpinning();
  });

  // Animation
  private animationFrameId: number | null = null;
  private spinStartedAt = 0;
  private spinDuration = 0;
  private spinStartRotation = 0;
  private spinTargetRotation = 0;

  async ngOnInit(): Promise<void> {
    try {
      const dungeons = await this.apiService.getDungeons();
      this.allDungeons.set([...dungeons].reverse());
    } catch {
      this.error.set('Impossible de charger la liste des donjons.');
    } finally {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  @HostListener('document:keydown.escape')
  closeOverlaysOnEscape(): void {
    this.closeDropdown();
    this.closeResult();
  }

  // Dropdown and selection
  toggleDropdown(): void {
    this.dropdownOpen.update(open => !open);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  selectDungeonForInput(dungeon: Dungeon): void {
    this.selectedDungeonForInput.set(dungeon);
    this.searchQuery.set(dungeon.name);
    this.weightInput.set('1');
    this.dropdownOpen.set(false);
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setWeightInput(value: string | number): void {
    this.weightInput.set(String(value));
  }

  addDungeon(): void {
    if (this.isSpinning()) return;

    const dungeon = this.selectedDungeonForInput();
    const weightStr = String(this.weightInput() || '').trim();
    
    if (!dungeon) return;
    
    const weight = parseInt(weightStr, 10);
    if (isNaN(weight) || weight <= 0) return;

    // Check if already selected
    this.selectedDungeons.update(selected => {
      const existingIndex = selected.findIndex(sd => sd.dungeon.name === dungeon.name);
      
      if (existingIndex >= 0) {
        // Update weight
        const updated = [...selected];
        updated[existingIndex] = { ...updated[existingIndex], weight };
        return updated;
      } else {
        // Add new
        return [...selected, { dungeon, weight }];
      }
    });

    // Reset
    this.selectedDungeonForInput.set(null);
    this.searchQuery.set('');
    this.weightInput.set('');
    this.dropdownOpen.set(false);
    this.finalSelectedDungeon.set(null);
  }

  removeSelectedDungeon(dungeonName: string): void {
    if (this.isSpinning()) return;

    this.selectedDungeons.update(selected => 
      selected.filter(sd => sd.dungeon.name !== dungeonName)
    );
    this.finalSelectedDungeon.set(null);
  }

  adjustDungeonWeight(dungeonName: string, delta: number): void {
    if (this.isSpinning() || delta === 0) return;

    this.selectedDungeons.update(selected =>
      selected.map(selectedDungeon =>
        selectedDungeon.dungeon.name === dungeonName
          ? { ...selectedDungeon, weight: Math.max(1, selectedDungeon.weight + delta) }
          : selectedDungeon
      )
    );
    this.finalSelectedDungeon.set(null);
  }

  closeResult(): void {
    this.finalSelectedDungeon.set(null);
  }

  // Wheel spinning
  spinWheel(): void {
    if (!this.canSpin()) return;

    this.isSpinning.set(true);
    this.finalSelectedDungeon.set(null);
    this.spinStartedAt = performance.now();
    this.spinDuration = 12_000 + Math.random() * 3_000;
    this.spinStartRotation = this.rotation();

    const fullTurns = 9 + Math.floor(Math.random() * 4);
    const randomLandingAngle = Math.random() * 360;
    this.spinTargetRotation = this.spinStartRotation + fullTurns * 360 + randomLandingAngle;

    this.animationFrameId = requestAnimationFrame((timestamp) => this.animateWheel(timestamp));
  }

  private animateWheel(timestamp: number): void {
    const segments = this.wheelSegments();
    if (segments.length === 0) {
      this.isSpinning.set(false);
      this.animationFrameId = null;
      return;
    }

    const progress = Math.min((timestamp - this.spinStartedAt) / this.spinDuration, 1);
    // Ease-out cubic: most of the distance is covered early, leaving a long suspenseful slowdown.
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const nextRotation = this.spinStartRotation
      + (this.spinTargetRotation - this.spinStartRotation) * easedProgress;
    this.rotation.set(nextRotation);

    if (progress >= 1) {
      this.finishSpin(segments);
      return;
    }

    this.animationFrameId = requestAnimationFrame((nextTimestamp) =>
      this.animateWheel(nextTimestamp)
    );
  }

  private finishSpin(segments: WheelSegment[]): void {
    this.rotation.set(this.spinTargetRotation);
    this.isSpinning.set(false);
    this.animationFrameId = null;

    const adjustedRotation = ((this.spinTargetRotation % 360) + 360) % 360;
    const stopPosition = (360 - adjustedRotation) % 360;
    const selectedSegment = segments.find(
      (segment) => segment.startAngle <= stopPosition && stopPosition < segment.endAngle
    ) ?? segments[segments.length - 1];

    this.finalSelectedDungeon.set({
      dungeon: selectedSegment.dungeon,
      weight: selectedSegment.weight
    });
  }

  // Helper to get image URL
  getImageUrl(imgPath: string): string {
    // Assuming images are in assets directory
    if (imgPath.startsWith('http')) return imgPath;
    return `/assets/${imgPath}`;
  }

  // Generate conic-gradient background for the wheel
  getWheelBackground(): string {
    const segments = this.wheelSegments();
    if (segments.length === 0) return 'radial-gradient(circle, #333 0%, #1a1a1a 100%)';
    
    const colorStops = segments.map(seg => 
      `${seg.color} ${seg.startAngle}deg ${seg.endAngle}deg`
    ).join(', ');
    
    return `conic-gradient(from 0deg, ${colorStops})`;
  }

  // Get segment label style for displaying dungeon names on wheel
  getSegmentLabelStyle(segment: WheelSegment): Record<string, string> {
    const radius = 120; // Distance from center for labels
    const midAngle = (segment.startAngle + segment.endAngle) / 2;
    
    // Rotate to face the segment direction, move outward, then unrotate to keep text horizontal
    return {
      transform: `rotate(${midAngle}deg) translateY(${-radius}px) rotate(${-midAngle}deg)`
    };
  }
}
