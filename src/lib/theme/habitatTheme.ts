import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Habitat for Humanity brand colors
const habitatGreen: MantineColorsTuple = [
  '#f0f9e8',
  '#dcefcb',
  '#bce198',
  '#9ad362',
  '#7dc736',
  '#76bc21', // Habitat Green primary
  '#65a319',
  '#528713',
  '#436c0f',
  '#2f4d08'
];

const habitatBlue: MantineColorsTuple = [
  '#e6f0f7',
  '#cce0ef',
  '#99c1df',
  '#66a2cf',
  '#3383bf',
  '#00457c', // Habitat Blue primary
  '#003e70',
  '#003364',
  '#002948',
  '#001f3c'
];

export const hfhTheme = createTheme({
  primaryColor: 'habitatGreen',
  colors: {
    habitatGreen,
    habitatBlue
  },
  fontFamily: 'Open Sans, system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily: 'Open Sans, system-ui, sans-serif',
    fontWeight: '700'
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'md'
      }
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: true
      }
    }
  }
});