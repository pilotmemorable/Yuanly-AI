import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, BORDER_RADIUS } from '../constants/theme';
import { Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 320;
const CARD_HEIGHT = 480;

interface ExperienceCardProps {
  experience: {
    title: string;
    price: number;
    rating: number;
    thumbnail: string;
    aiBadge?: string;
  };
  onPress: () => void;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ experience, onPress }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      style={styles.container} 
      onPress={onPress}
    >
      <Image source={{ uri: experience.thumbnail }} style={styles.image} />
      
      <View style={styles.overlay}>
        {experience.aiBadge && (
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>{experience.aiBadge}</Text>
          </View>
        )}
        
        <View style={styles.footer}>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>{experience.title}</Text>
            <View style={styles.ratingRow}>
              <Star size={14} color={COLORS.secondary} fill={COLORS.secondary} />
              <Text style={styles.ratingText}>{experience.rating}</Text>
            </View>
          </View>
          
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>¥{experience.price}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BORDER_RADIUS.card,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    margin: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0)', // To be replaced by LinearGradient in real app
  },
  aiBadge: {
    backgroundColor: COLORS.glass,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
    alignSelf: 'flex-start',
  },
  aiBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  priceTag: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
  },
  priceText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
