import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
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
export class DungeonWheelComponent implements OnInit {
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
  private velocity = 0;
  private friction = 0.990;
  private thresholdFriction = 0.997;
  private thresholdVelocity = 3;
  private minVelocity = 0.1;

  async ngOnInit(): Promise<void> {
    try {
      const dungeons = await this.apiService.getDungeons();
      this.allDungeons.set(dungeons);
    } catch (err) {
      this.error.set('Impossible de charger la liste des donjons.');
    } finally {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
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
    this.selectedDungeons.update(selected => 
      selected.filter(sd => sd.dungeon.name !== dungeonName)
    );
    this.finalSelectedDungeon.set(null);
  }

  // Wheel spinning
  spinWheel(): void {
    if (!this.canSpin()) return;

    this.isSpinning.set(true);
    this.finalSelectedDungeon.set(null);
    this.rotation.set(0);
    
    // Initial velocity with some randomness
    this.velocity = 15 + Math.random() * 10;
    
    this.animateWheel();
  }

  private animateWheel(): void {
    const segments = this.wheelSegments();
    if (segments.length === 0) {
      this.isSpinning.set(false);
      return;
    }

    // Update rotation
    this.rotation.update(rot => rot + this.velocity);
    let frictionToApply = this.friction;
    if (this.velocity < this.thresholdVelocity) {
      frictionToApply = this.thresholdFriction;
    }
    // Apply friction
    this.velocity *= frictionToApply;

    // Stop if velocity is too low
    if (this.velocity < this.minVelocity) {
      this.velocity = 0;
      this.isSpinning.set(false);
      
      // Determine which segment is at the top (12 o'clock = 0 degrees, but CSS rotation is clockwise)
      // Normalize rotation to [0, 360)
      const normalizedRotation = this.rotation() % 360;
      const adjustedRotation = normalizedRotation < 0 ? normalizedRotation + 360 : normalizedRotation;
      
      // Find segment that contains the top position (0 degrees)
      // The wheel is rotated, so we need to find where 0 degrees falls
      // Actually, we want the segment that is aligned with the top indicator
      // The top is at -rotation (because the wheel is rotated by rotation degrees)
      // So we need to find which segment contains -rotation mod 360
      
      // Let's think differently: after spinning, rotation is some value.
      // The top of the wheel (12 o'clock) corresponds to angle 0 in our segment definitions.
      // But the wheel has been rotated by `rotation` degrees clockwise.
      // So the segment that is at the top has its startAngle and endAngle shifted by rotation.
      // We need to find the segment where (startAngle - rotation) mod 360 <= 0 <= (endAngle - rotation) mod 360
      
      // Simpler: normalize rotation and find which segment contains it
      const stopPosition = 360 - (adjustedRotation % 360);
      
      for (const segment of segments) {
        if (segment.startAngle <= stopPosition && stopPosition < segment.endAngle) {
          this.finalSelectedDungeon.set({
            dungeon: segment.dungeon,
            weight: segment.weight
          });
          break;
        }
      }
      
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => this.animateWheel());
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
  getSegmentLabelStyle(segment: WheelSegment): any {
    const radius = 120; // Distance from center for labels
    const midAngle = (segment.startAngle + segment.endAngle) / 2;
    
    // Rotate to face the segment direction, move outward, then unrotate to keep text horizontal
    return {
      transform: `rotate(${midAngle}deg) translateY(${-radius}px) rotate(${-midAngle}deg)`
    };
  }
}
