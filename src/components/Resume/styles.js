import styled from "styled-components";
export const Container = styled.section`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
  & > :first-child { grid-column: 1 / -1; }
  @media (min-width: 768px) {
    grid-template-columns: minmax(0, 1.55fr) minmax(190px, .72fr) minmax(190px, .72fr); gap: 16px;
    & > :first-child { grid-column: auto; }
  }
`;
