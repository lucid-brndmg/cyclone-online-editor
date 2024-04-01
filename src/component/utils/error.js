import {Button, Container, Group, Text, Title} from "@mantine/core";
import classes from "../../styles/modules/ErrorPageTemplate.module.css"
import {PublicUrl} from "@/core/utils/resource";

// referenced: https://ui.mantine.dev/category/error-pages/
// Error page: 404
export const ErrorPageTemplate = ({
  code,
  title,
  description
}) => {
  return (
    <Container className={classes.root}>
      <div className={classes.label}>{code}</div>
      <Title className={classes.title}>{title}</Title>
      <Text c="dimmed" size="lg" ta="center" className={classes.description}>
        {description}
      </Text>
      <Group justify="center">
        <Button variant="subtle" size="md" component={"a"} href={PublicUrl.Home}>
          Take me back to home page
        </Button>
      </Group>
    </Container>
  )
}